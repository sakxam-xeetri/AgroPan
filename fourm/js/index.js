/* ============================================================
   AgroPan Forum — Client-Side Logic
   ============================================================
   Auth-aware: logged-in users can post, vote, answer.
   Guests can only read.
   ============================================================ */

(function () {
    'use strict';

    // ── API Helpers ──
    var API = '../API/';

    function api(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(body || {})
        }).then(function (r) { return r.json(); });
    }

    // ── DOM Refs ──
    var questionsEl = document.getElementById('questions-list');
    var loadingEl = document.getElementById('loading');
    var emptyEl = document.getElementById('empty-state');
    var askBtn = document.getElementById('ask-btn');
    var askModal = document.getElementById('ask-modal');
    var askForm = document.getElementById('ask-form');
    var modalClose = document.getElementById('modal-close');
    var modalCancel = document.getElementById('modal-cancel');
    var submitBtn = document.getElementById('submit-btn');
    var detailModal = document.getElementById('detail-modal');
    var detailTitle = document.getElementById('detail-title');
    var detailBody = document.getElementById('detail-body');
    var detailClose = document.getElementById('detail-close');
    var loginPrompt = document.getElementById('login-prompt');
    var navAuth = document.getElementById('nav-auth');
    var filtersEl = document.getElementById('forum-filters');
    var toastEl = document.getElementById('toast');

    // ── State ──
    var currentUser = null; // null = guest
    var allQuestions = [];
    var activeFilter = 'all';
    var toastTimer = null;

    // ── SVG Icons ──
    var upArrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    var downArrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';
    var commentSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    // ── Utilities ──
    function parseVotes(voteStr) {
        if (!voteStr || voteStr === '0') return [];
        return voteStr.split(',').filter(function (v) { return v.trim() !== '' && v.trim() !== '0'; });
    }

    function hasVoted(voteStr, userId) {
        return parseVotes(voteStr).indexOf(String(userId)) !== -1;
    }

    function voteCount(voteStr) {
        return parseVotes(voteStr).length;
    }

    function escHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function answerCount(q) {
        if (!q.answers || q.answers === '') return 0;
        return q.answers.split(',').filter(function (v) { return v.trim() !== ''; }).length;
    }

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 3000);
    }

    // ── Auth Check ──
    function checkAuth() {
        return api('auth.php', { action: 'status' }).then(function (res) {
            if (res.success && res.data) {
                currentUser = res.data;
                renderAuthUI(true);
            } else {
                currentUser = null;
                renderAuthUI(false);
            }
        }).catch(function () {
            currentUser = null;
            renderAuthUI(false);
        });
    }

    function renderAuthUI(loggedIn) {
        if (loggedIn) {
            var initials = (currentUser.name || currentUser.username || '?').charAt(0).toUpperCase();
            navAuth.innerHTML =
                '<div class="forum-nav__user">' +
                '<div class="forum-nav__avatar">' + escHtml(initials) + '</div>' +
                '<span>' + escHtml(currentUser.name || currentUser.username) + '</span>' +
                '</div>' +
                '<button class="btn btn--sm btn--ghost" id="logout-btn" style="color:#fff;border-color:rgba(255,255,255,0.3)">Logout</button>';
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
            askBtn.style.display = '';
            loginPrompt.style.display = 'none';
        } else {
            navAuth.innerHTML = '<a href="../login.html" class="btn btn--primary btn--sm" id="nav-login-btn">Log In</a>';
            askBtn.style.display = 'none';
            loginPrompt.style.display = 'flex';
        }
    }

    function handleLogout() {
        api('auth.php', { action: 'logout' }).then(function () {
            currentUser = null;
            renderAuthUI(false);
            renderQuestions();
            showToast('Logged out successfully');
        });
    }

    // ── Load Questions ──
    function loadQuestions() {
        loadingEl.style.display = '';
        emptyEl.style.display = 'none';
        return api('read/questions.php', {}).then(function (res) {
            loadingEl.style.display = 'none';
            if (res.success && Array.isArray(res.data)) {
                allQuestions = res.data;
            } else {
                allQuestions = [];
            }
            renderQuestions();
        }).catch(function () {
            loadingEl.style.display = 'none';
            allQuestions = [];
            renderQuestions();
        });
    }

    // ── Render Question List ──
    function renderQuestions() {
        // Filter
        var filtered = allQuestions;
        if (activeFilter !== 'all') {
            filtered = allQuestions.filter(function (q) { return q.type === activeFilter; });
        }

        // Clear previous cards (keep loading/empty)
        var cards = questionsEl.querySelectorAll('.q-card');
        for (var i = 0; i < cards.length; i++) cards[i].remove();

        if (filtered.length === 0) {
            emptyEl.style.display = '';
            return;
        }
        emptyEl.style.display = 'none';

        var frag = document.createDocumentFragment();
        filtered.forEach(function (q) {
            frag.appendChild(buildQuestionCard(q));
        });
        questionsEl.appendChild(frag);
    }

    function buildQuestionCard(q) {
        var card = document.createElement('div');
        card.className = 'q-card';
        card.setAttribute('data-id', q.question_id);

        var ups = voteCount(q.upvotes);
        var downs = voteCount(q.downvotes);
        var score = ups - downs;
        var answers = answerCount(q);
        var isLoggedIn = !!currentUser;
        var userId = isLoggedIn ? String(currentUser.user_id) : null;
        var votedUp = isLoggedIn && hasVoted(q.upvotes, currentUser.user_id);
        var votedDown = isLoggedIn && hasVoted(q.downvotes, currentUser.user_id);
        var disabledClass = isLoggedIn ? '' : ' disabled';

        card.innerHTML =
            '<div class="q-card__votes">' +
            '<button class="q-card__vote-btn' + (votedUp ? ' active-up' : '') + disabledClass + '" data-dir="up" data-qid="' + q.question_id + '" title="Upvote">' + upArrowSvg + '</button>' +
            '<span class="q-card__score">' + score + '</span>' +
            '<button class="q-card__vote-btn' + (votedDown ? ' active-down' : '') + disabledClass + '" data-dir="down" data-qid="' + q.question_id + '" title="Downvote">' + downArrowSvg + '</button>' +
            '</div>' +
            '<div class="q-card__body">' +
            '<div class="q-card__question">' + escHtml(q.question) + '</div>' +
            '<div class="q-card__meta">' +
            '<span class="q-card__type q-card__type--' + escHtml(q.type) + '">' + escHtml(q.type) + '</span>' +
            '<span>by <strong>' + escHtml(q.asked_by) + '</strong></span>' +
            '<span class="q-card__answers-count">' + commentSvg + ' ' + answers + ' answer' + (answers !== 1 ? 's' : '') + '</span>' +
            '</div>' +
            '</div>';

        // Vote button clicks (stop propagation so card click doesn't fire)
        var voteBtns = card.querySelectorAll('.q-card__vote-btn');
        for (var i = 0; i < voteBtns.length; i++) {
            voteBtns[i].addEventListener('click', function (e) {
                e.stopPropagation();
                var dir = this.getAttribute('data-dir');
                var qid = this.getAttribute('data-qid');
                handleQuestionVote(qid, dir);
            });
        }

        // Card click — open detail
        card.addEventListener('click', function () {
            openQuestionDetail(q.question_id);
        });

        return card;
    }

    // ── Vote on Question ──
    function handleQuestionVote(questionId, direction) {
        if (!currentUser) {
            showToast('Please log in to vote');
            return;
        }

        // Find question in state
        var q = allQuestions.find(function (item) { return String(item.question_id) === String(questionId); });
        if (!q) return;

        var userId = String(currentUser.user_id);
        var upList = parseVotes(q.upvotes);
        var downList = parseVotes(q.downvotes);

        if (direction === 'up') {
            if (upList.indexOf(userId) !== -1) {
                // Remove upvote (toggle off)
                upList = upList.filter(function (v) { return v !== userId; });
            } else {
                // Add upvote, remove from downvotes if present
                upList.push(userId);
                downList = downList.filter(function (v) { return v !== userId; });
            }
        } else {
            if (downList.indexOf(userId) !== -1) {
                // Remove downvote (toggle off)
                downList = downList.filter(function (v) { return v !== userId; });
            } else {
                // Add downvote, remove from upvotes if present
                downList.push(userId);
                upList = upList.filter(function (v) { return v !== userId; });
            }
        }

        var newUpvotes = upList.length > 0 ? upList.join(',') : '0';
        var newDownvotes = downList.length > 0 ? downList.join(',') : '0';

        api('update/questions.php', {
            question_id: parseInt(questionId),
            upvotes: newUpvotes,
            downvotes: newDownvotes
        }).then(function (res) {
            if (res.success) {
                // Update local state
                q.upvotes = newUpvotes;
                q.downvotes = newDownvotes;
                renderQuestions();
            } else {
                showToast('Failed to vote: ' + (res.message || 'Unknown error'));
            }
        }).catch(function () {
            showToast('Network error. Please try again.');
        });
    }

    // ── Vote on Answer ──
    function handleAnswerVote(answerId, direction, callback) {
        if (!currentUser) {
            showToast('Please log in to vote');
            return;
        }

        // First fetch the answer to get current votes
        api('read/answers.php', { answer_id: parseInt(answerId) }).then(function (res) {
            if (!res.success || !res.data) { showToast('Answer not found'); return; }

            var ans = res.data;
            var userId = String(currentUser.user_id);
            var upList = parseVotes(ans.upvotes);
            var downList = parseVotes(ans.downvotes);

            if (direction === 'up') {
                if (upList.indexOf(userId) !== -1) {
                    upList = upList.filter(function (v) { return v !== userId; });
                } else {
                    upList.push(userId);
                    downList = downList.filter(function (v) { return v !== userId; });
                }
            } else {
                if (downList.indexOf(userId) !== -1) {
                    downList = downList.filter(function (v) { return v !== userId; });
                } else {
                    downList.push(userId);
                    upList = upList.filter(function (v) { return v !== userId; });
                }
            }

            var newUp = upList.length > 0 ? upList.join(',') : '0';
            var newDown = downList.length > 0 ? downList.join(',') : '0';

            return api('update/answers.php', {
                answer_id: parseInt(answerId),
                upvotes: newUp,
                downvotes: newDown
            }).then(function (r) {
                if (r.success && callback) callback();
                else if (!r.success) showToast('Failed to vote');
            });
        }).catch(function () {
            showToast('Network error. Please try again.');
        });
    }

    // ── Open Question Detail ──
    function openQuestionDetail(questionId) {
        var q = allQuestions.find(function (item) { return String(item.question_id) === String(questionId); });
        if (!q) return;

        detailTitle.textContent = 'Question';
        detailBody.innerHTML = '<div class="forum-loading"><div class="forum-spinner"></div><p>Loading…</p></div>';
        detailModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Fetch answers
        api('read/answers.php', { question_id: parseInt(questionId) }).then(function (res) {
            var answers = (res.success && Array.isArray(res.data)) ? res.data : [];
            renderQuestionDetail(q, answers);
        }).catch(function () {
            renderQuestionDetail(q, []);
        });
    }

    function renderQuestionDetail(q, answers) {
        var isLoggedIn = !!currentUser;
        var userId = isLoggedIn ? String(currentUser.user_id) : null;
        var ups = voteCount(q.upvotes);
        var downs = voteCount(q.downvotes);
        var score = ups - downs;
        var votedUp = isLoggedIn && hasVoted(q.upvotes, currentUser.user_id);
        var votedDown = isLoggedIn && hasVoted(q.downvotes, currentUser.user_id);
        var disabledClass = isLoggedIn ? '' : ' disabled';

        var html =
            '<div class="detail-question">' + escHtml(q.question) + '</div>' +
            '<div class="detail-meta">' +
            '<span class="q-card__type q-card__type--' + escHtml(q.type) + '">' + escHtml(q.type) + '</span>' +
            '<span>Asked by <strong>' + escHtml(q.asked_by) + '</strong></span>' +
            '</div>' +
            '<div class="detail-vote-row">' +
            '<button class="detail-vote-btn' + (votedUp ? ' active-up' : '') + disabledClass + '" data-dir="up" data-qid="' + q.question_id + '">' + upArrowSvg + ' Upvote</button>' +
            '<span class="detail-score">' + score + '</span>' +
            '<button class="detail-vote-btn' + (votedDown ? ' active-down' : '') + disabledClass + '" data-dir="down" data-qid="' + q.question_id + '">' + downArrowSvg + ' Downvote</button>' +
            '</div>';

        // Answers
        html += '<div class="answers-section">';
        html += '<h3 class="answers-heading">' + answers.length + ' Answer' + (answers.length !== 1 ? 's' : '') + '</h3>';

        if (answers.length === 0) {
            html += '<div class="no-answers">No answers yet. Be the first to help!</div>';
        } else {
            answers.forEach(function (a) {
                var aUps = voteCount(a.upvotes);
                var aDowns = voteCount(a.downvotes);
                var aScore = aUps - aDowns;
                var aVotedUp = isLoggedIn && hasVoted(a.upvotes, currentUser.user_id);
                var aVotedDown = isLoggedIn && hasVoted(a.downvotes, currentUser.user_id);

                html +=
                    '<div class="answer-card" data-aid="' + a.answer_id + '">' +
                    '<div class="answer-text">' + escHtml(a.answer) + '</div>' +
                    '<div class="answer-meta">Answered by <strong>' + escHtml(a.answered_by) + '</strong></div>' +
                    '<div class="answer-vote-row">' +
                    '<button class="answer-vote-btn' + (aVotedUp ? ' active-up' : '') + disabledClass + '" data-dir="up" data-aid="' + a.answer_id + '">' + upArrowSvg.replace(/18/g, '14') + ' ' + aUps + '</button>' +
                    '<span class="answer-score">' + aScore + '</span>' +
                    '<button class="answer-vote-btn' + (aVotedDown ? ' active-down' : '') + disabledClass + '" data-dir="down" data-aid="' + a.answer_id + '">' + downArrowSvg.replace(/18/g, '14') + ' ' + aDowns + '</button>' +
                    '</div>' +
                    '</div>';
            });
        }

        // Answer form (only if logged in)
        if (isLoggedIn) {
            html +=
                '<div class="answer-form">' +
                '<textarea id="answer-text" placeholder="Write your answer…" rows="3"></textarea>' +
                '<div class="answer-form__actions">' +
                '<button class="btn btn--primary btn--sm" id="submit-answer-btn">Post Answer</button>' +
                '</div>' +
                '</div>';
        }
        html += '</div>'; // close answers-section

        detailBody.innerHTML = html;

        // Bind question vote buttons in detail
        var qVoteBtns = detailBody.querySelectorAll('.detail-vote-btn');
        for (var i = 0; i < qVoteBtns.length; i++) {
            qVoteBtns[i].addEventListener('click', function () {
                var dir = this.getAttribute('data-dir');
                var qid = this.getAttribute('data-qid');
                handleQuestionVote(qid, dir);
                // Re-render detail after vote
                setTimeout(function () { openQuestionDetail(qid); }, 300);
            });
        }

        // Bind answer vote buttons
        var aVoteBtns = detailBody.querySelectorAll('.answer-vote-btn');
        for (var j = 0; j < aVoteBtns.length; j++) {
            aVoteBtns[j].addEventListener('click', function () {
                var dir = this.getAttribute('data-dir');
                var aid = this.getAttribute('data-aid');
                var qid = q.question_id;
                handleAnswerVote(aid, dir, function () {
                    openQuestionDetail(qid); // refresh
                });
            });
        }

        // Bind submit answer
        var submitAnswerBtn = document.getElementById('submit-answer-btn');
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', function () {
                var textarea = document.getElementById('answer-text');
                var text = textarea.value.trim();
                if (!text) { showToast('Please write an answer'); return; }

                submitAnswerBtn.disabled = true;
                submitAnswerBtn.textContent = 'Posting…';

                api('create/answers.php', {
                    question_id: parseInt(q.question_id),
                    answer: text,
                    answered_by: currentUser.username
                }).then(function (res) {
                    if (res.success) {
                        showToast('Answer posted!');
                        // Reload questions to update answer count
                        loadQuestions().then(function () {
                            openQuestionDetail(q.question_id);
                        });
                    } else {
                        showToast('Failed: ' + (res.message || 'Unknown error'));
                        submitAnswerBtn.disabled = false;
                        submitAnswerBtn.textContent = 'Post Answer';
                    }
                }).catch(function () {
                    showToast('Network error');
                    submitAnswerBtn.disabled = false;
                    submitAnswerBtn.textContent = 'Post Answer';
                });
            });
        }
    }

    // ── Ask Question Modal ──
    askBtn.addEventListener('click', function () {
        askModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('q-text').focus();
    });

    function closeAskModal() {
        askModal.style.display = 'none';
        document.body.style.overflow = '';
        askForm.reset();
    }
    modalClose.addEventListener('click', closeAskModal);
    modalCancel.addEventListener('click', closeAskModal);
    askModal.addEventListener('click', function (e) {
        if (e.target === askModal) closeAskModal();
    });

    askForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!currentUser) { showToast('Please log in first'); return; }

        var type = document.getElementById('q-type').value;
        var question = document.getElementById('q-text').value.trim();
        if (!type || !question) { showToast('Please fill all fields'); return; }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting…';

        api('create/questions.php', {
            question: question,
            type: type,
            asked_by: currentUser.username
        }).then(function (res) {
            if (res.success) {
                showToast('Question posted!');
                closeAskModal();
                loadQuestions();
            } else {
                showToast('Failed: ' + (res.message || 'Unknown error'));
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Question';
        }).catch(function () {
            showToast('Network error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Question';
        });
    });

    // ── Detail Modal Close ──
    function closeDetailModal() {
        detailModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    detailClose.addEventListener('click', closeDetailModal);
    detailModal.addEventListener('click', function (e) {
        if (e.target === detailModal) closeDetailModal();
    });

    // ── Filter Tabs ──
    filtersEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.forum-filter');
        if (!btn) return;
        activeFilter = btn.getAttribute('data-type');
        var all = filtersEl.querySelectorAll('.forum-filter');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
        btn.classList.add('active');
        renderQuestions();
    });

    // ── Keyboard: Escape to close modals ──
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (askModal.style.display !== 'none') closeAskModal();
            if (detailModal.style.display !== 'none') closeDetailModal();
        }
    });

    // ── Init ──
    checkAuth().then(function () {
        loadQuestions();
    });

})();

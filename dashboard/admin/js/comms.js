/**
 * AgroPan — Admin: Communications CRUD (Emails + Questions + Answers)
 */

(function () {
    'use strict';

    var API = '../../API/';

    /* ── Shared helpers ─────────────────────────────────── */
    function api(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify(body || {})
        }).then(function (r) { return r.json(); });
    }

    function ts(unix) {
        if (!unix) return '—';
        var d = new Date(unix * 1000);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function toast(msg, type) {
        var el = document.createElement('div');
        el.className = 'toast toast--' + (type || 'success');
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(function () { el.style.animation = 'toastOut 0.3s forwards'; }, 2500);
        setTimeout(function () { el.remove(); }, 2900);
    }

    function truncate(str, len) {
        if (!str) return '—';
        return str.length > len ? str.substring(0, len) + '…' : str;
    }

    /* ── Tabs ───────────────────────────────────────────── */
    var tabButtons = document.querySelectorAll('.tab-bar__btn');
    var tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabButtons.forEach(function (b) { b.classList.remove('is-active'); });
            tabPanels.forEach(function (p) { p.classList.remove('is-active'); });
            btn.classList.add('is-active');
            var tab = btn.dataset.tab;
            if (tab === 'emails') document.getElementById('panelEmails').classList.add('is-active');
            if (tab === 'questions') document.getElementById('panelQuestions').classList.add('is-active');
            if (tab === 'answers') document.getElementById('panelAnswers').classList.add('is-active');
        });
    });

    /* ── Delete confirm shared state ────────────────────── */
    var deleteConfirm = document.getElementById('deleteConfirm');
    var deleteCancel = document.getElementById('deleteCancel');
    var deleteOk = document.getElementById('deleteOk');
    var pendingDelete = null;

    deleteCancel.addEventListener('click', function () { deleteConfirm.classList.remove('is-open'); pendingDelete = null; });
    deleteConfirm.addEventListener('click', function (e) { if (e.target === deleteConfirm) { deleteConfirm.classList.remove('is-open'); pendingDelete = null; } });

    deleteOk.addEventListener('click', function () {
        if (!pendingDelete) return;
        var fn = pendingDelete;
        pendingDelete = null;
        deleteConfirm.classList.remove('is-open');
        fn();
    });

    function confirmDelete(fn) { pendingDelete = fn; deleteConfirm.classList.add('is-open'); }

    /* ═══════════════════════════════════════════════════════
       EMAIL SUBSCRIBERS
       ═══════════════════════════════════════════════════════ */
    var allEmails = [];
    var emailSearch = document.getElementById('emailSearch');
    var emailFilter = document.getElementById('emailFilter');
    var emailTableBody = document.getElementById('emailTableBody');
    var emailRowCount = document.getElementById('emailRowCount');

    var emailModal = document.getElementById('emailModal');
    var emailModalTitle = document.getElementById('emailModalTitle');

    function loadEmails() {
        api('read/emails.php', { all: true }).then(function (res) {
            allEmails = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            document.getElementById('emailCount').textContent = allEmails.length;
            renderEmails();
        }).catch(function () { emailTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>'; });
    }

    function renderEmails() {
        var q = emailSearch.value.toLowerCase().trim();
        var f = emailFilter.value;
        var filtered = allEmails.filter(function (e) {
            if (f !== '' && String(e.is_active) !== f) return false;
            if (q && (e.name || '').toLowerCase().indexOf(q) === -1 && (e.email || '').toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
        emailRowCount.textContent = filtered.length + ' subscriber' + (filtered.length !== 1 ? 's' : '');
        if (!filtered.length) { emailTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No subscribers found.</td></tr>'; return; }
        emailTableBody.innerHTML = filtered.map(function (e) {
            var status = Number(e.is_active) ? '<span class="badge badge--success">Active</span>' : '<span class="badge badge--neutral">Inactive</span>';
            return '<tr><td>' + e.email_id + '</td><td><strong>' + (e.name || '—') + '</strong></td><td>' + (e.email || '—') + '</td><td>' + status + '</td><td style="font-size:var(--text-xs);color:var(--color-text-muted)">' + ts(e.subscribed_at) + '</td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-eedit="' + e.email_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-edel="' + e.email_id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
        emailTableBody.querySelectorAll('[data-eedit]').forEach(function (b) { b.addEventListener('click', function () { openEmailEdit(this.dataset.eedit); }); });
        emailTableBody.querySelectorAll('[data-edel]').forEach(function (b) { b.addEventListener('click', function () { var id = this.dataset.edel; confirmDelete(function () { deleteEmail(id); }); }); });
    }

    emailSearch.addEventListener('input', renderEmails);
    emailFilter.addEventListener('change', renderEmails);

    function openEmailModal() { emailModal.classList.add('is-open'); }
    function closeEmailModal() { emailModal.classList.remove('is-open'); document.getElementById('eId').value = ''; document.getElementById('eName').value = ''; document.getElementById('eEmail').value = ''; document.getElementById('eActive').value = '1'; }

    document.getElementById('emailModalClose').addEventListener('click', closeEmailModal);
    document.getElementById('emailModalCancel').addEventListener('click', closeEmailModal);
    emailModal.addEventListener('click', function (e) { if (e.target === emailModal) closeEmailModal(); });

    document.getElementById('addEmail').addEventListener('click', function () {
        closeEmailModal();
        emailModalTitle.textContent = 'New Subscriber';
        openEmailModal();
    });

    function openEmailEdit(id) {
        var item = allEmails.find(function (e) { return String(e.email_id) === String(id); });
        if (!item) return;
        emailModalTitle.textContent = 'Edit Subscriber #' + id;
        document.getElementById('eId').value = item.email_id;
        document.getElementById('eName').value = item.name || '';
        document.getElementById('eEmail').value = item.email || '';
        document.getElementById('eActive').value = String(item.is_active);
        openEmailModal();
    }

    document.getElementById('emailModalSave').addEventListener('click', function () {
        var id = document.getElementById('eId').value;
        var name = document.getElementById('eName').value.trim();
        var email = document.getElementById('eEmail').value.trim();
        var isActive = Number(document.getElementById('eActive').value);
        if (!name || !email) { toast('Name and email are required.', 'error'); return; }

        if (!id) {
            api('create/emails.php', { email: email, name: name }).then(function (res) {
                if (res.success) { toast('Subscriber added.'); closeEmailModal(); loadEmails(); } else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            api('update/emails.php', { email_id: id, email: email, name: name, is_active: isActive }).then(function (res) {
                if (res.success) { toast('Subscriber updated.'); closeEmailModal(); loadEmails(); } else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        }
    });

    function deleteEmail(id) {
        api('delete/emails.php', { email_id: id }).then(function (res) {
            if (res.success) { toast('Subscriber deleted.'); loadEmails(); } else { toast(res.message || 'Failed.', 'error'); }
        }).catch(function () { toast('Network error.', 'error'); });
    }

    /* ═══════════════════════════════════════════════════════
       QUESTIONS
       ═══════════════════════════════════════════════════════ */
    var allQuestions = [];
    var questionSearch = document.getElementById('questionSearch');
    var questionFilter = document.getElementById('questionFilter');
    var questionTableBody = document.getElementById('questionTableBody');
    var questionRowCount = document.getElementById('questionRowCount');

    var questionModal = document.getElementById('questionModal');
    var questionModalTitle = document.getElementById('questionModalTitle');

    function loadQuestions() {
        api('read/questions.php', {}).then(function (res) {
            allQuestions = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            document.getElementById('questionCount').textContent = allQuestions.length;
            renderQuestions();
        }).catch(function () { questionTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>'; });
    }

    function voteCount(v) { if (!v || v === '0') return 0; return v.split(',').filter(Boolean).length; }

    function renderQuestions() {
        var q = questionSearch.value.toLowerCase().trim();
        var f = questionFilter.value;
        var filtered = allQuestions.filter(function (item) {
            if (f && item.type !== f) return false;
            if (q && (item.question || '').toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
        questionRowCount.textContent = filtered.length + ' question' + (filtered.length !== 1 ? 's' : '');
        if (!filtered.length) { questionTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No questions found.</td></tr>'; return; }
        questionTableBody.innerHTML = filtered.map(function (item) {
            var answerCount = item.answers ? item.answers.split(',').filter(Boolean).length : 0;
            var up = voteCount(item.upvotes);
            var down = voteCount(item.downvotes);
            return '<tr><td>' + item.question_id + '</td>' +
                '<td style="max-width:250px;white-space:normal;word-break:break-word;font-size:var(--text-sm)">' + truncate(item.question, 80) + '</td>' +
                '<td><span class="badge badge--info">' + (item.type || '—') + '</span></td>' +
                '<td><strong>' + (item.asked_by || '—') + '</strong></td>' +
                '<td style="font-size:var(--text-xs)"><span style="color:var(--color-success)"><i class="fa-solid fa-thumbs-up"></i> ' + up + '</span>&nbsp;&nbsp;<span style="color:var(--color-danger)"><i class="fa-solid fa-thumbs-down"></i> ' + down + '</span></td>' +
                '<td><span class="badge badge--neutral">' + answerCount + '</span></td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-qedit="' + item.question_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-qdel="' + item.question_id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
        questionTableBody.querySelectorAll('[data-qedit]').forEach(function (b) { b.addEventListener('click', function () { openQuestionEdit(this.dataset.qedit); }); });
        questionTableBody.querySelectorAll('[data-qdel]').forEach(function (b) { b.addEventListener('click', function () { var id = this.dataset.qdel; confirmDelete(function () { deleteQuestion(id); }); }); });
    }

    questionSearch.addEventListener('input', renderQuestions);
    questionFilter.addEventListener('change', renderQuestions);

    function openQuestionModal() { questionModal.classList.add('is-open'); }
    function closeQuestionModal() { questionModal.classList.remove('is-open'); document.getElementById('qId').value = ''; document.getElementById('qText').value = ''; document.getElementById('qType').value = 'disease'; document.getElementById('qAskedBy').value = ''; }

    document.getElementById('questionModalClose').addEventListener('click', closeQuestionModal);
    document.getElementById('questionModalCancel').addEventListener('click', closeQuestionModal);
    questionModal.addEventListener('click', function (e) { if (e.target === questionModal) closeQuestionModal(); });

    document.getElementById('addQuestion').addEventListener('click', function () {
        closeQuestionModal();
        questionModalTitle.textContent = 'New Question';
        openQuestionModal();
    });

    function openQuestionEdit(id) {
        var item = allQuestions.find(function (q) { return String(q.question_id) === String(id); });
        if (!item) return;
        questionModalTitle.textContent = 'Edit Question #' + id;
        document.getElementById('qId').value = item.question_id;
        document.getElementById('qText').value = item.question || '';
        document.getElementById('qType').value = item.type || 'general';
        document.getElementById('qAskedBy').value = item.asked_by || '';
        openQuestionModal();
    }

    document.getElementById('questionModalSave').addEventListener('click', function () {
        var id = document.getElementById('qId').value;
        var question = document.getElementById('qText').value.trim();
        var type = document.getElementById('qType').value;
        var asked_by = document.getElementById('qAskedBy').value.trim();
        if (!question || !type || !asked_by) { toast('All fields are required.', 'error'); return; }

        if (!id) {
            api('create/questions.php', { question: question, type: type, asked_by: asked_by }).then(function (res) {
                if (res.success) { toast('Question posted.'); closeQuestionModal(); loadQuestions(); } else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            api('update/questions.php', { question_id: id, question: question, type: type, asked_by: asked_by }).then(function (res) {
                if (res.success) { toast('Question updated.'); closeQuestionModal(); loadQuestions(); } else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        }
    });

    function deleteQuestion(id) {
        api('delete/questions.php', { question_id: id }).then(function (res) {
            if (res.success) { toast('Question & linked answers deleted.'); loadQuestions(); loadAnswers(); } else { toast(res.message || 'Failed.', 'error'); }
        }).catch(function () { toast('Network error.', 'error'); });
    }

    /* ═══════════════════════════════════════════════════════
       ANSWERS
       ═══════════════════════════════════════════════════════ */
    var allAnswers = [];
    var answerSearch = document.getElementById('answerSearch');
    var answerTableBody = document.getElementById('answerTableBody');
    var answerRowCount = document.getElementById('answerRowCount');

    var answerModal = document.getElementById('answerModal');
    var answerModalTitle = document.getElementById('answerModalTitle');

    function loadAnswers() {
        api('read/answers.php', {}).then(function (res) {
            allAnswers = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
            document.getElementById('answerCount').textContent = allAnswers.length;
            renderAnswers();
        }).catch(function () { answerTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">Failed to load.</td></tr>'; });
    }

    function renderAnswers() {
        var q = answerSearch.value.toLowerCase().trim();
        var filtered = allAnswers.filter(function (a) {
            if (q && (a.answer || '').toLowerCase().indexOf(q) === -1 && (a.answered_by || '').toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
        answerRowCount.textContent = filtered.length + ' answer' + (filtered.length !== 1 ? 's' : '');
        if (!filtered.length) { answerTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-light);padding:var(--space-xl)">No answers found.</td></tr>'; return; }
        answerTableBody.innerHTML = filtered.map(function (a) {
            var up = voteCount(a.upvotes);
            var down = voteCount(a.downvotes);
            return '<tr><td>' + a.answer_id + '</td>' +
                '<td style="max-width:300px;white-space:normal;word-break:break-word;font-size:var(--text-sm)">' + truncate(a.answer, 100) + '</td>' +
                '<td><strong>' + (a.answered_by || '—') + '</strong></td>' +
                '<td style="font-size:var(--text-xs)"><span style="color:var(--color-success)"><i class="fa-solid fa-thumbs-up"></i> ' + up + '</span>&nbsp;&nbsp;<span style="color:var(--color-danger)"><i class="fa-solid fa-thumbs-down"></i> ' + down + '</span></td>' +
                '<td><div class="actions-cell">' +
                '<button class="btn btn--icon-sm btn--ghost" title="Edit" data-aedit="' + a.answer_id + '"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn btn--icon-sm btn--danger" title="Delete" data-adel="' + a.answer_id + '"><i class="fa-solid fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
        answerTableBody.querySelectorAll('[data-aedit]').forEach(function (b) { b.addEventListener('click', function () { openAnswerEdit(this.dataset.aedit); }); });
        answerTableBody.querySelectorAll('[data-adel]').forEach(function (b) { b.addEventListener('click', function () { var id = this.dataset.adel; confirmDelete(function () { deleteAnswer(id); }); }); });
    }

    answerSearch.addEventListener('input', renderAnswers);

    function openAnswerModal() { answerModal.classList.add('is-open'); }
    function closeAnswerModal() { answerModal.classList.remove('is-open'); document.getElementById('aId').value = ''; document.getElementById('aQuestionId').value = ''; document.getElementById('aText').value = ''; document.getElementById('aAnsweredBy').value = ''; document.getElementById('aQuestionGroup').style.display = ''; }

    document.getElementById('answerModalClose').addEventListener('click', closeAnswerModal);
    document.getElementById('answerModalCancel').addEventListener('click', closeAnswerModal);
    answerModal.addEventListener('click', function (e) { if (e.target === answerModal) closeAnswerModal(); });

    document.getElementById('addAnswer').addEventListener('click', function () {
        closeAnswerModal();
        answerModalTitle.textContent = 'New Answer';
        openAnswerModal();
    });

    function openAnswerEdit(id) {
        var item = allAnswers.find(function (a) { return String(a.answer_id) === String(id); });
        if (!item) return;
        answerModalTitle.textContent = 'Edit Answer #' + id;
        document.getElementById('aId').value = item.answer_id;
        document.getElementById('aText').value = item.answer || '';
        document.getElementById('aAnsweredBy').value = item.answered_by || '';
        document.getElementById('aQuestionGroup').style.display = 'none'; // hide question_id on edit
        openAnswerModal();
    }

    document.getElementById('answerModalSave').addEventListener('click', function () {
        var id = document.getElementById('aId').value;
        var answer = document.getElementById('aText').value.trim();
        var answered_by = document.getElementById('aAnsweredBy').value.trim();

        if (!answer || !answered_by) { toast('Answer and author are required.', 'error'); return; }

        if (!id) {
            var questionId = document.getElementById('aQuestionId').value.trim();
            if (!questionId) { toast('Question ID is required for a new answer.', 'error'); return; }
            api('create/answers.php', { question_id: questionId, answer: answer, answered_by: answered_by }).then(function (res) {
                if (res.success) { toast('Answer posted.'); closeAnswerModal(); loadAnswers(); loadQuestions(); } else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        } else {
            api('update/answers.php', { answer_id: id, answer: answer, answered_by: answered_by }).then(function (res) {
                if (res.success) { toast('Answer updated.'); closeAnswerModal(); loadAnswers(); } else { toast(res.message || 'Failed.', 'error'); }
            }).catch(function () { toast('Network error.', 'error'); });
        }
    });

    function deleteAnswer(id) {
        api('delete/answers.php', { answer_id: id }).then(function (res) {
            if (res.success) { toast('Answer deleted.'); loadAnswers(); loadQuestions(); } else { toast(res.message || 'Failed.', 'error'); }
        }).catch(function () { toast('Network error.', 'error'); });
    }

    /* ── Initial Load ──────────────────────────────────── */
    loadEmails();
    loadQuestions();
    loadAnswers();

})();

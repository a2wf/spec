document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-a2wf-copy]');
    if (!trigger) {
        return;
    }

    var selector = trigger.getAttribute('data-a2wf-copy');
    var el = document.querySelector(selector);
    if (!el) {
        return;
    }

    el.select();
    el.setSelectionRange(0, 999999);
    navigator.clipboard.writeText(el.value).then(function () {
        trigger.textContent = 'Kopiert';
        window.setTimeout(function () {
            trigger.textContent = 'JSON kopieren';
        }, 1200);
    });
});

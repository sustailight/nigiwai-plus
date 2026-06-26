document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ===== ヘッダー：スクロールで背景を締める ===== */
    const header = document.getElementById('header');
    const onScroll = () => {
        if (window.scrollY > 40) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ===== バーガーメニュー（スマホ） ===== */
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        burger.classList.remove('active');
        nav.classList.remove('open');
    }));

    /* ===== スクロールリビール ===== */
    const revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('revealed');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('revealed'));
    }

    /* ===== 実績の数字カウントアップ（控えめ） ===== */
    const counters = document.querySelectorAll('[data-count]');
    const animateCount = (el) => {
        const target = parseInt(el.dataset.count, 10);
        if (reduceMotion || isNaN(target)) { return; }
        const hasComma = el.textContent.indexOf(',') !== -1;
        const duration = 1100;
        const start = performance.now();
        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.floor(eased * target);
            el.textContent = hasComma ? val.toLocaleString('en-US') : val;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = hasComma ? target.toLocaleString('en-US') : target;
        };
        requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
        const cio = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
            });
        }, { threshold: 0.6 });
        counters.forEach(c => cio.observe(c));
    }

    /* ===== スマホ追従CTA：ヒーローを過ぎたら表示、フォーム到達で隠す ===== */
    const sticky = document.getElementById('stickyCta');
    const hero = document.querySelector('.hero');
    const contact = document.getElementById('contact');
    const updateSticky = () => {
        const heroBottom = hero.getBoundingClientRect().bottom;
        const contactTop = contact.getBoundingClientRect().top;
        const past = heroBottom < 0;
        const atForm = contactTop < window.innerHeight * 0.9;
        if (past && !atForm) sticky.classList.add('show');
        else sticky.classList.remove('show');
    };
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky);
    updateSticky();

    /* ===== アンカーのスムーススクロール（固定ヘッダー分のオフセット） ===== */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const y = target.getBoundingClientRect().top + window.scrollY - 60;
            window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });
});

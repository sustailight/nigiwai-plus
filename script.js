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

    /* ===== 実績の数字：スクロールでカウントアップ ===== */
    const countEls = document.querySelectorAll('[data-count]');
    const formatNum = (n, withComma) => withComma ? n.toLocaleString('en-US') : String(n);
    const runCount = (el) => {
        const target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        const withComma = (el.textContent || '').indexOf(',') !== -1 || target >= 1000;
        if (reduceMotion) { el.textContent = formatNum(target, withComma); return; }
        const duration = 1400;
        let startTime = null;
        const step = (ts) => {
            if (startTime === null) startTime = ts;
            const p = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            el.textContent = formatNum(Math.round(target * eased), withComma);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = formatNum(target, withComma);
        };
        requestAnimationFrame(step);
    };
    if (countEls.length) {
        if ('IntersectionObserver' in window && !reduceMotion) {
            const co = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
                });
            }, { threshold: 0.6 });
            countEls.forEach(el => { el.textContent = '0'; co.observe(el); });
        } else {
            countEls.forEach(runCount);
        }
    }

    /* ===== スマホ追従CTA：ヒーローを過ぎたら表示、フォーム到達で隠す ===== */
    const sticky = document.getElementById('stickyCta');
    const hero = document.querySelector('.hero');
    const contact = document.getElementById('contact');
    const updateSticky = () => {
        if (!sticky || !hero || !contact) return;
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

    /* ===== 代表写真：ホバーで一瞬ホワイトアウトして別カットに切替 ===== */
    const repPhoto = document.getElementById('repPhoto');
    if (repPhoto) {
        const flash = repPhoto.querySelector('.rp-flash');
        let swapping = false;
        const swapTo = (alt) => {
            if (repPhoto.classList.contains('no-alt') || swapping || reduceMotion) {
                // 動きを減らす設定・代替写真なしの場合は即時切替のみ
                if (!repPhoto.classList.contains('no-alt')) repPhoto.classList.toggle('alt', alt);
                return;
            }
            swapping = true;
            flash.style.transition = 'opacity 0.1s ease-in';
            flash.style.opacity = '1';
            setTimeout(() => {
                repPhoto.classList.toggle('alt', alt);
                flash.style.transition = 'opacity 0.45s ease-out';
                flash.style.opacity = '0';
                setTimeout(() => { swapping = false; }, 450);
            }, 110);
        };
        repPhoto.addEventListener('mouseenter', () => swapTo(true));
        repPhoto.addEventListener('mouseleave', () => swapTo(false));
        // タッチ端末はタップで切替
        repPhoto.addEventListener('touchstart', () => swapTo(!repPhoto.classList.contains('alt')), { passive: true });
    }

    /* ===== Googleフォーム送信（隠しiframeにPOST → サンクスページへ） ===== */
    const gframe = document.getElementById('gformFrame');
    let pendingThanks = null;
    let submitTimer = null;

    if (gframe) {
        gframe.addEventListener('load', () => {
            // Googleフォームへの送信完了（レスポンスは読めないがloadは発火する）
            if (pendingThanks) {
                const url = pendingThanks;
                pendingThanks = null;
                if (submitTimer) { clearTimeout(submitTimer); submitTimer = null; }
                window.location.href = url;
            }
        });
    }

    document.querySelectorAll('form[data-gform]').forEach(form => {
        form.addEventListener('submit', (e) => {
            // 接続前（プレースホルダのまま）は送信させず案内する
            if (form.action.indexOf('REPLACE_') !== -1) {
                e.preventDefault();
                alert('フォームは現在準備中です。お手数ですが msr.sustailight@gmail.com、または 080-3284-7050 までご連絡ください。');
                return;
            }
            // 興味チェックを1つのテキストに結合して隠しフィールドへ（Googleフォーム側は記述式）
            const interestTarget = form.querySelector('[data-interest-target]');
            if (interestTarget) {
                const vals = Array.prototype.map.call(
                    form.querySelectorAll('input[data-interest]:checked'),
                    (c) => c.value
                );
                interestTarget.value = vals.length ? vals.join('、') : '（未選択）';
            }
            // 送信中表示
            const btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = '送信中…'; }
            pendingThanks = form.dataset.thanks || 'thanks.html';
            // 万一 iframe の load が発火しない場合の保険（2.5秒で遷移）
            submitTimer = setTimeout(() => {
                if (pendingThanks) {
                    const url = pendingThanks;
                    pendingThanks = null;
                    window.location.href = url;
                }
            }, 2500);
            // preventDefaultしない＝そのまま target=gform-frame へPOSTされる
        });
    });
});

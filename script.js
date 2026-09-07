const modal = document.querySelector('.modal');
const content = document.querySelector('#modal-content');
const resumeReady = true;
const resumeUrl = '/files/Aiki-Zhou-Resume-2026.pdf';

let audioContext;
let audioUnlocked = false;

function paperSound(level = 0.65) {
  if (!audioUnlocked) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();

  const duration = 0.055;
  const sampleCount = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    const envelope = Math.pow(1 - i / sampleCount, 2.6);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = 1150;
  filter.Q.value = 0.75;
  gain.gain.value = 0.05 * level;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(audioContext.destination);
  source.start();
}

let lastResumeSoundAt = 0;
function resumePaperSound(level = 0.78) {
  if (!audioUnlocked) return;
  const now = performance.now();
  if (now - lastResumeSoundAt < 180) return;
  lastResumeSoundAt = now;

  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();

  const start = audioContext.currentTime;
  const duration = 0.32;
  const sampleCount = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let smoothedNoise = 0;
  for (let i = 0; i < sampleCount; i += 1) {
    const progress = i / sampleCount;
    const fade = Math.sin(Math.PI * progress) * Math.pow(1 - progress, 0.28);
    smoothedNoise = smoothedNoise * 0.72 + (Math.random() * 2 - 1) * 0.28;
    const fibre = Math.sin(i * 0.19) * 0.12 + Math.sin(i * 0.047) * 0.08;
    data[i] = (smoothedNoise + fibre) * fade;
  }

  const source = audioContext.createBufferSource();
  const highpass = audioContext.createBiquadFilter();
  const lowpass = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  highpass.type = 'highpass';
  highpass.frequency.value = 380;
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(4200, start);
  lowpass.frequency.exponentialRampToValueAtTime(1500, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(0.075 * level, start + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(0.94, start);
  source.playbackRate.linearRampToValueAtTime(1.08, start + duration);
  source.connect(highpass).connect(lowpass).connect(gain).connect(audioContext.destination);
  source.start(start);
}

function bubbleSound() {
  if (!audioUnlocked) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  const start = audioContext.currentTime;
  [
    { delay: 0, frequency: 440, duration: .11, volume: .045 },
    { delay: .08, frequency: 610, duration: .13, volume: .038 },
    { delay: .17, frequency: 820, duration: .16, volume: .032 }
  ].forEach(({ delay, frequency, duration, volume }) => {
    const strike = start + delay;
    const gain = audioContext.createGain();
    const bell = audioContext.createOscillator();
    const shimmer = audioContext.createOscillator();
    bell.type = 'sine';
    shimmer.type = 'sine';
    bell.frequency.value = frequency;
    shimmer.frequency.value = frequency * 1.5;
    gain.gain.setValueAtTime(.0001, strike);
    gain.gain.exponentialRampToValueAtTime(volume, strike + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, strike + duration);
    bell.connect(gain);
    shimmer.connect(gain);
    gain.connect(audioContext.destination);
    bell.start(strike);
    shimmer.start(strike);
    bell.stop(strike + duration + .01);
    shimmer.stop(strike + duration + .01);
  });
}

const soundTargets = document.querySelectorAll('.object:not([data-resume-card])');
document.querySelectorAll('.object').forEach(element => {
  element.addEventListener('animationend', event => {
    if (event.animationName === 'hang') element.classList.add('is-mounted');
  });
});
document.addEventListener('pointerdown', event => {
  audioUnlocked = true;
  if (event.target.closest('.object:not([data-resume-card])')) paperSound(0.72);
}, { capture: true });
soundTargets.forEach(element => element.addEventListener('pointerenter', () => paperSound(0.65)));

const resumeSoundTargets = document.querySelectorAll('[data-resume-open]');
resumeSoundTargets.forEach(element => {
  element.addEventListener('pointerenter', () => resumePaperSound(0.68));
  element.addEventListener('pointerdown', () => {
    audioUnlocked = true;
    resumePaperSound(0.9);
  });
  element.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    audioUnlocked = true;
    resumePaperSound(0.82);
  });
});

const resumePreview = `<article class="resume-preview" aria-labelledby="resume-preview-title"><header><p>03 / RESUME · CAREER RECORD</p><h2 id="resume-preview-title">AIKI ZHOU</h2><span>周艾琦 · 2026</span></header><figure><img src="assets/resume/Aiki-Zhou-Resume-2026.png?v=20260906-2" alt="周艾琦 2026 中文简历完整预览"><i class="resume-curl" aria-hidden="true"></i></figure><footer><span>PDF SOURCE · Aiki-Zhou-Resume-2026.pdf</span><span>AIKI ARCHIVE · 2026</span></footer></article>`;

document.querySelectorAll('[data-resume-open]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    if (!resumeReady || !resumeUrl) return;
    content.innerHTML = resumePreview;
    modal.showModal();
  });
});

document.querySelectorAll('.nav a[href^="#"]').forEach(link => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target?.classList.contains('object') || target.hasAttribute('data-resume-card')) return;
  const connect = () => {
    link.classList.add('remote-link-active');
    target.classList.add('remote-active');
  };
  const disconnect = () => {
    link.classList.remove('remote-link-active');
    target.classList.remove('remote-active');
  };
  link.addEventListener('pointerenter', connect);
  link.addEventListener('pointerleave', disconnect);
  link.addEventListener('focus', connect);
  link.addEventListener('blur', disconnect);
});

const panels = {
  about: `<div class="about-modal" data-birth-date=""><i class="about-pink-tape" aria-hidden="true"></i><header class="about-heading"><p class="modal-kicker">01 / ABOUT AIKI · PERSONAL NOTE</p><h2>HI, I’M AIKI</h2><span>很高兴认识你</span></header><div class="about-layout"><figure><i aria-hidden="true"></i><img src="assets/aiki-portrait.jpg" alt="周艾琦在餐厅自然光线中的生活照"><figcaption>A QUIET MOMENT · 2026</figcaption></figure><section class="about-copy"><h3>周艾琦 <span>/ Aiki</span></h3><p class="about-origin"><span data-about-age>23</span>岁，来自广东汕头。</p><div class="about-story"><p>我喜欢拍照、记录生活，也常常对新的东西感到好奇。</p><p>比起站在聚光灯下，我更习惯先观察，再慢慢表达。</p><p>从汕头到珠海，再到墨尔本，我正在一点点认识更大的世界，也认识新的自己。</p></div><section class="about-education"><h4>MY JOURNEY &amp; EDUCATION</h4><div class="education-timeline"><article><time>2021 → 2025</time><i aria-hidden="true"></i><div><small>ZHUHAI</small><strong>Zhuhai College of Science and Technology</strong><span>B.A. Advertising</span></div></article><article><time>2025 → 2026</time><i aria-hidden="true"></i><div><small>MELBOURNE</small><strong>Monash University</strong><span>Master of Communication and Media Studies</span><em>CURRENT · EXPECTED 2026</em></div></article></div></section><section class="about-traits"><h4>A LITTLE LIKE ME</h4><div class="trait-list"><button type="button" data-trait-note="What happens if I try this?"><b>CURIOUS</b><span>What happens if I try this?</span></button><button type="button" data-trait-note="I notice the little things."><b>OBSERVANT</b><span>I notice the little things.</span></button><button type="button" data-trait-note="People matter to me."><b>WARM</b><span>People matter to me.</span></button><button type="button" data-trait-note="I find my rhythm wherever I go."><b>ADAPTABLE</b><span>I find my rhythm wherever I go.</span></button></div></section><button class="about-explore" type="button" data-archive-index><span>EXPLORE MY ARCHIVE</span><i aria-hidden="true">→</i></button></section></div><footer><span>01 / PERSONAL NOTE</span><i></i><span>AIKI ARCHIVE · 2026</span></footer></div>`,
  skills: `<div class="skills-window"><i class="skills-top-clip" aria-hidden="true"></i><i class="skills-pink-tape" aria-hidden="true"></i><header><p class="modal-kicker">04 / CAPABILITY FILE</p><h2>SKILLS &amp; TOOLS</h2><span>内容、传播与数字工具</span></header><div class="skills-file-grid"><section class="core-capabilities"><h3>CORE CAPABILITIES</h3><article><b>01</b><div><strong>CONTENT</strong><p>内容策划 · 短视频制作 · 文案写作<br>社交媒体运营 · 商品内容组织</p><button type="button" data-archive-index>VIEW ARCHIVE 01–03 →</button></div></article><article><b>02</b><div><strong>RESEARCH &amp; OPERATIONS</strong><p>市场与竞品研究 · 信息核对<br>现场协调 · 问题处理</p><button type="button" data-archive-index>VIEW ARCHIVE 03–06 →</button></div></article><article><b>03</b><div><strong>COMMUNICATION</strong><p>客户沟通 · 跨文化沟通<br>英文工作协作</p><button type="button" data-archive-index>VIEW ARCHIVE 03–06 →</button></div></article></section><section class="tools-systems tools-systems--expanded"><h3>TOOLS &amp; SYSTEMS</h3><article><b>电商运营</b><p>Shopify 商品上传 · 商品信息维护 · Collections 规划<br>网站导航设置 · 页面内容维护 · POS 测试</p></article><article><b>内容运营</b><p>社交媒体选题 · 内容策划 · 短视频制作<br>产品文案 · 品牌合作 · 基础数据复盘</p></article><article><b>设计与视频</b><p>Canva · CapCut</p></article><article><b>办公工具</b><p>Excel 基础数据整理、筛选、排序、条件格式及常用函数<br>PowerPoint · Google Sheets</p></article><article><b>语言</b><p>蒙纳士大学传播与媒体研究硕士在读，具备英文资料检索、跨文化沟通及澳洲本地工作经验</p></article><article><b>AI 辅助</b><p>OpenAI Codex · ChatGPT<br>用于独立站页面原型生成、海外资料整理、内容框架搭建及基础文案优化</p></article></section></div><footer><span>04 / CAPABILITY FILE</span><span>UPDATED 2026</span><button type="button" data-archive-index>VIEW PROJECT EVIDENCE →</button></footer></div>`,
  contact: `<div class="modal-inner"><p class="modal-kicker">05 / CONTACT · 联系方式</p><h2>Let’s keep in touch.</h2><div class="contact-layout"><div class="contact-details"><a href="mailto:aiki927666@gmail.com">aiki927666@gmail.com</a><a href="tel:+8615767064012">WeChat / 电话<br>15767064012</a></div><div class="qr-wrap"><img src="assets/wechat-qr.jpg" alt="周艾琦的微信二维码"><small>SCAN TO ADD ON WECHAT</small></div></div></div>`,
  current: `<div class="availability-window"><p class="modal-kicker">06 / AVAILABILITY</p><main><b>AVAILABLE FOR FULL-TIME</b><strong>DEC 2026</strong><i aria-hidden="true"></i><p>2026年12月起可全职到岗</p></main><button type="button" data-panel-jump="contact"><span>CONTACT AIKI</span><i aria-hidden="true">→</i></button></div>`
};

panels.about = panels.about.replace(/<div class="about-story">[\s\S]*?<\/div><section class="about-education">/, '<section class="about-education">');

const zhuhaiPanel = `<div class="zhuhai-window">
  <span class="zhuhai-paper-layer zhuhai-paper-layer--one" aria-hidden="true"></span>
  <span class="zhuhai-paper-layer zhuhai-paper-layer--two" aria-hidden="true"></span>
  <span class="zhuhai-top-clip" aria-hidden="true"></span>
  <span class="zhuhai-pink-tape" aria-hidden="true"></span>
  <header>
    <p class="modal-kicker">ARCHIVE 01 · 2021—2025</p>
    <h2>MADE IN ZHUHAI <span>本科广告学 · 创作课程档案</span></h2>
  </header>
  <div class="zhuhai-file-grid">
    <article class="zhuhai-film-card">
      <span class="zhuhai-index">01</span>
      <div class="zhuhai-video-frame"><video controls preload="metadata" playsinline><source src="assets/zhuhai/ad-creative-film.mp4" type="video/x-m4v"></video></div>
      <h3>课堂作品</h3>
      <p>广告创意拍摄 · 01:19</p>
      <small>从想法到成片，完整参与广告创意与制作流程，<br>在实践中不断打磨表达与执行。</small>
    </article>
    <div class="zhuhai-right-file">
      <div class="course-cloud">
      <p>从想法、脚本到拍摄与剪辑，<br>课程让我不断把创意做成真实作品。</p>
      <section><b>01</b><strong>创意</strong><span>广告创意 / 文案写作 / 脚本创作</span></section>
      <section><b>02</b><strong>影像</strong><span>摄影 / 广告拍摄 / 视频剪辑 / 图像处理</span></section>
      <section><b>03</b><strong>传播</strong><span>新媒体运营 / 品牌传播 / 整合营销</span></section>
      <section><b>04</b><strong>研究</strong><span>市场调查 / 消费者行为 / 受众分析</span></section>
      </div>
      <article class="mini-award">
        <span class="award-paperclip" aria-hidden="true"></span>
        <img src="assets/zhuhai/award-certificate.jpg" alt="学院奖优秀奖证书">
        <div><b>学院奖 · 优秀奖</b><span>影视广告《一“抹”即平》<br>2023.12</span></div>
        <span class="award-tape" aria-hidden="true"></span>
      </article>
    </div>
  </div>
  <footer class="zhuhai-footer"><span>01 / COURSEWORK ARCHIVE</span><i></i><button type="button" data-next-topic="I MADE THINGS ON THE INTERNET">NEXT FILE →</button></footer>
</div>`;

const reelItems = [
  ['account-data.jpg', '67 篇内容 · 持续发布'],
  ['scarf.jpg', '围巾品牌 · 图文合作'],
  ['phone-case.jpg', '手机壳品牌 · 场景内容'],
  ['skincare.jpg', '洁面产品 · VLOG'],
  ['headphones.jpg', '耳机品牌 · VLOG'],
  ['unretro.jpg', 'UNRETRO · 穿搭合作'],
  ['urbanforest.jpg', 'Urban Forest Campsite · 穿搭合作']
];

const reelCards = [...reelItems, ...reelItems].map(([image, caption], index) => `
  <figure class="reel-card">
    <span class="reel-number">${String(index % reelItems.length + 1).padStart(2, '0')}</span><span class="reel-paused">PAUSED</span>
    <img src="assets/internet/${image}" alt="${caption}" loading="lazy">
    <figcaption>${caption}</figcaption>
  </figure>`).join('');

const internetPanel = `<div class="internet-window">
  <span class="internet-paper internet-paper--one" aria-hidden="true"></span><span class="internet-paper internet-paper--two" aria-hidden="true"></span><span class="internet-top-clip" aria-hidden="true"></span><span class="internet-pink-tape" aria-hidden="true"></span>
  <header>
    <p class="modal-kicker">ARCHIVE 02 · 2022—2023</p>
    <h2>I MADE THINGS<br>ON THE INTERNET</h2><strong>小红书内容运营与品牌合作</strong><small>CONTENT OPERATIONS · SOCIAL VIDEO</small>
  </header>
  <div class="reel-control"><span>CONTENT STREAM · AUTO SCROLL</span><i>— → → → → → → → → → →</i><b>HOVER A CARD TO PAUSE&nbsp; ‖</b></div>
  <div class="photo-reel" aria-label="小红书内容与品牌合作照片，鼠标停留可暂停">
    <div class="reel-track">${reelCards}</div>
  </div>
  <div class="internet-bottom">
    <div class="internet-stats">
      <article><b>01</b><strong><span data-count="2000">0</span>+</strong><small>粉丝 <i>AUDIENCE</i></small></article>
      <article><b>02</b><strong><span data-count="25000">0</span>+</strong><small>累计点赞 <i>ENGAGEMENT</i></small></article>
      <article><b>03</b><strong><span data-count="20">0</span>+</strong><small>品牌合作 <i>COLLABORATIONS</i></small></article>
    </div>
    <div class="internet-note"><b>MY TAKEAWAY</b><p>从选题、脚本、拍摄到剪辑和复盘，我第一次真正理解：<br>好内容既要表达自己，也要理解观众和品牌。</p><span>时尚 · 美妆护肤 · 生活方式</span></div>
  </div>
  <footer class="internet-footer"><span>02 / CONTENT OPERATIONS FILE</span><i></i><button type="button" data-next-topic="INTO THE REAL WORLD">NEXT FILE →</button></footer>
</div>`;

const internshipPanel = `<div class="internship-window">
  <span class="intern-paper intern-paper--one" aria-hidden="true"></span><span class="intern-paper intern-paper--two" aria-hidden="true"></span><span class="intern-top-clip" aria-hidden="true"></span><span class="intern-pink-tape" aria-hidden="true"></span>
  <header>
    <p class="modal-kicker">ARCHIVE 03 · 2024.03—05</p>
    <h2>INTO THE REAL WORLD <span>珠海达庵文化 · 广告实习生</span></h2>
  </header>
  <div class="internship-question"><b>THE BRIEF</b><strong>60+ 条短视频，如何从一个模糊需求走到按期交付？</strong></div>
  <div class="internship-case-grid">
    <article class="case-monitor">
      <p>· ONE OF 60+ DELIVERIES</p>
      <div class="monitor-shell">
        <span class="case-label">CASE 01</span>
        <div class="case-preview"><video controls muted playsinline preload="metadata"><source src="assets/internship/foreign-interview-full.mp4" type="video/x-m4v"></video><span class="preview-rec">● FULL CUT</span><span class="preview-caption">FOREIGN INTERVIEW · 00:46</span></div>
        <footer>案例切片 01 · 短视频剪辑</footer>
      </div>
    </article>
    <aside class="internship-results">
      <div class="delivery-ticket"><b>DELIVERED</b><strong class="odometer" aria-label="60+"><span class="roll-digit roll-six"><i><em>0</em><em>1</em><em>2</em><em>3</em><em>4</em><em>5</em><em>6</em></i></span><span class="roll-digit roll-zero"><i><em>0</em><em>1</em><em>2</em><em>3</em><em>4</em><em>5</em><em>6</em><em>7</em><em>8</em><em>9</em><em>0</em></i></span><sup>+</sup></strong><small>条短视频 · 全部按期交付</small></div>
      <div class="client-note"><b>CLIENT FEEDBACK</b><div class="feedback-rotator"><span>“节奏再快一点。”</span><span>“把产品卖点提前。”</span><span>“字幕需要更清晰。”</span></div></div>
      <div class="editing-checklist"><b>EDITING CHECKLIST</b><div><span>街头采访</span><span>情感口播</span><span>拍摄口播</span><span>素人改造</span><span>聚会交友</span><span>剧情脚本</span></div></div>
    </div>
  </div>
  <div class="work-flow" aria-label="从需求到交付的工作流程">
    <span><b>01</b><em>理解需求</em><small>目标 · 受众 · 卖点</small></span><i>→</i>
    <span><b>02</b><em>创意拆解</em><small>脚本 · 素材筛选</small></span><i>→</i>
    <span><b>03</b><em>CapCut 剪辑</em><small>字幕 · 音乐 · 节奏</small></span><i>→</i>
    <span><b>04</b><em>客户反馈</em><small>沟通 · 修改 · 确认</small></span><i>→</i>
    <span><b>05</b><em>按期交付</em><small>60+ 条全部完成</small></span>
  </div>
  <div class="internship-takeaway"><b>WHAT I LEARNED</b><p>剪辑不只是“把素材拼起来”。我学会了在速度、创意与客户目标之间做判断，把模糊需求变成可以准时交付的内容。</p></div>
  <footer class="internship-footer"><span>03 / INTERNSHIP CASE FILE</span><i></i><button type="button" data-next-topic="A BIGGER WORLD">NEXT FILE →</button></footer>
</div>`;

const monashPanel = `<div class="monash-window">
  <span class="monash-paper monash-paper--one" aria-hidden="true"></span><span class="monash-paper monash-paper--two" aria-hidden="true"></span><span class="monash-top-clip" aria-hidden="true"></span>
  <header><p class="modal-kicker">ARCHIVE 04 · 2025—2026</p><h2>A BIGGER WORLD</h2><span>Monash University · Melbourne</span><strong>MASTER OF COMMUNICATION &amp; MEDIA STUDIES</strong></header>
  <figure class="campus-context"><img src="assets/monash/campus-panorama.jpg" alt="Monash University 校园全景"><figcaption><b>01 / CAMPUS CONTEXT</b><span>从熟悉的中文课堂，走进用英语讨论全球媒体、数据、文化与受众的学习现场。</span></figcaption></figure>
  <div class="monash-learning-grid">
    <div class="monash-photo-pair">
      <figure><span class="photo-paperclip" aria-hidden="true"></span><span class="photo-tape photo-tape--yellow" aria-hidden="true"></span><img src="assets/monash/independent-study.jpg" alt="在蒙纳士大学户外使用电脑学习"><figcaption>02 / INDEPENDENT STUDY</figcaption></figure>
      <figure><span class="photo-tape" aria-hidden="true"></span><img src="assets/monash/classroom-collaboration.jpg" alt="蒙纳士大学课堂合照"><figcaption>03 / CLASSROOM COLLABORATION</figcaption></figure>
    </div>
    <section class="learning-map"><h3>LEARNING MAP</h3>
      <article><b>01</b><strong>MEDIA SYSTEMS<small>媒体系统</small></strong><span>Global Media Industries<small>全球媒体产业</small></span><span>Global Media &amp; Communications<small>全球媒体与传播</small></span></article>
      <article><b>02</b><strong>AUDIENCES<small>受众</small></strong><span>Engaging Audiences<small>受众互动</small></span><span>Understanding Media Audiences<small>媒体受众研究</small></span></article>
      <article><b>03</b><strong>RESEARCH &amp; DATA<small>研究与数据</small></strong><span>Data Analytics in Communications<small>传播数据分析</small></span><span>Media &amp; Communications Research<small>媒体与传播研究</small></span></article>
      <article><b>04</b><strong>DIGITAL CULTURE<small>数字文化</small></strong><span>Digital Cultures &amp; Platforms<small>数字文化与平台</small></span><span>Digital Technology, Policy &amp; Governance<small>数字技术、政策与治理</small></span></article>
    </section>
  </div>
  <div class="monash-output"><div class="assignment-strip"><b>WHAT I MADE</b><div><span>PRESENTATION</span><i>/</i><span>ESSAY</span><i>/</i><span>REPORT</span><i>/</i><span>TEAMWORK</span></div></div><div class="grade-board"><b>HIGH MARKS</b><span><strong>84</strong>Global Media Industries</span><span><strong>81</strong>Engaging Audiences</span><span><strong>80</strong>Media Audiences</span><i>WAM 75.75</i></div></div>
  <footer class="monash-footer"><span>04 / POSTGRADUATE STUDY FILE</span><i></i><button type="button" data-next-topic="LEARNING TO SPEAK UP">NEXT FILE →</button></footer>
</div>`;

const restaurantPanel = `<div class="restaurant-window">
  <i class="restaurant-top-clip" aria-hidden="true"></i>
  <header>
    <p class="modal-kicker">ARCHIVE 05 · 2025.08—NOW</p>
    <h2>LEARNING TO SPEAK UP</h2>
    <span>Melbourne Restaurant · Front of House</span>
    <strong>PART-TIME WORK · ENGLISH · LEADERSHIP</strong>
  </header>
  <div class="restaurant-lead"><b>TEAM MEMBER → FRONT OF HOUSE LEAD</b><span>一步步得到认可，成为负责人。</span></div>
  <div class="restaurant-scene">
    <button class="character-stage" type="button" aria-label="前厅迎宾员，点击显示问候语" aria-expanded="false">
      <span class="touch-hint"><i aria-hidden="true">●</i><b>HOVER / TAP</b><small>TO SAY HELLO</small></span>
      <span class="hover-speech">Hi! How are you?<small>CUSTOMER GREETING · 01</small></span>
      <span class="floor-plan" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b class="plan-counter"></b><b class="plan-entry">ENTRY</b><b class="plan-plant">♧</b></span>
      <img src="assets/restaurant/front-of-house.png" alt="拿着点单本、正在迎宾的前厅工作人员">
    </button>
    <div class="growth-board">
      <div class="role-ladder">
        <article><b>01</b><strong>TEAM MEMBER</strong><small>熟悉流程 · 稳定服务</small></article>
        <i>→</i>
        <article><b>02</b><strong>TAKE THE LEAD</strong><small>主动协调 · 处理问题</small></article>
        <i>→</i>
        <article class="role-now"><b>03</b><strong>FRONT OF HOUSE LEAD</strong><small>统筹现场 · 带领团队</small></article>
      </div>
      <div class="responsibility-board">
        <b>WHAT I HANDLE</b>
        <span>STAFF ROSTERS <small>员工排班</small></span>
        <span>INVENTORY <small>库存管理</small></span>
        <span>PEAK-HOUR FLOW <small>高峰协调</small></span>
        <span>CUSTOMER CARE <small>客户沟通</small></span>
        <span>PROBLEM SOLVING <small>现场应变</small></span>
        <span>TEAMWORK IN ENGLISH <small>英文协作</small></span>
      </div>
    </div>
  </div>
  <div class="restaurant-growth"><b>MY GROWTH</b><span>CONFIDENCE ↑</span><i>→</i><span>COMMUNICATION ↑</span><i>→</i><span>LEADERSHIP ↑<small>SPEAK · DECIDE · LEAD</small></span></div>
  <footer class="restaurant-footer"><span>05 / FRONT OF HOUSE FILE</span><i></i><button type="button" data-next-topic="CURRENTLY EXPLORING">NEXT FILE →</button></footer>
</div>`;

const currentArchivePanel = `<div class="current-window">
  <i class="current-top-clip" aria-hidden="true"></i><i class="current-tape" aria-hidden="true"></i>
  <header><p class="modal-kicker">ARCHIVE 06 · 2026.08—NOW</p><h2>CURRENTLY EXPLORING</h2><span>Vision Verse Interactive Pty Ltd · Australia</span><strong>市场营销与社交媒体实习生</strong><p>围绕艺术家商品，参与商品资料审核、上线资料核对、内容整理与竞品研究，支持商品信息更准确、清晰地呈现。</p><em><i></i> IN PROGRESS</em></header>
  <div class="current-main">
    <aside class="work-evidence"><b>WORK EVIDENCE</b><article><strong>数百件</strong><span>艺术家商品资料<br>审核与维护</span></article><article><strong><span class="current-counter" data-count="50">50</span>+件</strong><span>商品上线资料核对<br>信息 · 价格 · 图片 · 页面</span></article><small>Cornven POS · 配置与测试</small></aside>
    <section class="current-duties">
      <h3>WHAT I WORK ON</h3>
      <article><b>01</b><div><strong>商品资料审核与维护</strong><p>审核艺术家商品资料，检查并修正文档、库存、图片和页面信息中的错误与缺漏。</p></div></article>
      <article><b>02</b><div><strong>商品上线资料核对</strong><p>核对商品信息、价格、图片与页面资料，参与 Cornven POS 配置测试并跟进上线前修正。</p></div></article>
      <article><b>03</b><div><strong>商品内容整理</strong><p>梳理艺术家背景、作品特点、材质规格与消费场景，协助搭建产品描述模板。</p></div></article>
      <article><b>04</b><div><strong>市场与竞品研究</strong><p>研究同类品牌的商品分类、首页结构、Gift Guide 专题页与社交媒体内容。</p></div></article>
    </section>
  </div>
</div>`;

function animateCounters(scope) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scope.querySelectorAll('[data-count]').forEach(counter => {
    const target = Number(counter.dataset.count);
    if (reducedMotion) {
      counter.textContent = target.toLocaleString('en-US');
      return;
    }
    const start = performance.now();
    const duration = 1100;
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function playMutedClip(scope) {
  const video = scope.querySelector('video[data-clip-start]');
  if (!video) return;
  const start = Number(video.dataset.clipStart || 0);
  const end = Number(video.dataset.clipEnd || start + 6);
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  const begin = () => {
    video.currentTime = start;
    video.play().catch(() => {});
  };
  video.addEventListener('loadedmetadata', begin, { once: true });
  video.addEventListener('timeupdate', () => {
    if (video.currentTime >= end) begin();
  });
  if (video.readyState >= 1) begin();
}

function openPanel(name) {
  content.innerHTML = panels[name];
  modal.showModal();
  if (name === 'about') updateAboutAge();
}

function updateAboutAge() {
  const about = content.querySelector('.about-modal');
  const age = about?.querySelector('[data-about-age]');
  const birthDate = about?.dataset.birthDate;
  if (!age || !birthDate) return;
  const born = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return;
  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();
  const birthdayPassed = today.getMonth() > born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!birthdayPassed) years -= 1;
  age.textContent = String(years);
}

document.querySelectorAll('[data-panel]').forEach(el => el.addEventListener('click', () => openPanel(el.dataset.panel)));
document.querySelectorAll('[data-topic]').forEach(el => el.addEventListener('click', () => {
  if (el.dataset.topic === 'MADE IN ZHUHAI') {
    content.innerHTML = zhuhaiPanel;
    modal.showModal();
    content.querySelector('video')?.load();
    return;
  }
  if (el.dataset.topic === 'I MADE THINGS ON THE INTERNET') {
    content.innerHTML = internetPanel;
    modal.showModal();
    animateCounters(content);
    return;
  }
  if (el.dataset.topic === 'INTO THE REAL WORLD') {
    content.innerHTML = internshipPanel;
    modal.showModal();
    animateCounters(content);
    const internshipVideo = content.querySelector('video');
    if (internshipVideo) {
      internshipVideo.muted = true;
      internshipVideo.defaultMuted = true;
      internshipVideo.volume = 0;
    }
    return;
  }
  if (el.dataset.topic === 'A BIGGER WORLD') {
    content.innerHTML = monashPanel;
    modal.showModal();
    return;
  }
  if (el.dataset.topic === 'LEARNING TO SPEAK UP') {
    content.innerHTML = restaurantPanel;
    modal.showModal();
    return;
  }
  if (el.dataset.topic === 'CURRENTLY EXPLORING') {
    content.innerHTML = currentArchivePanel;
    modal.showModal();
    animateCounters(content);
    return;
  }
  content.innerHTML = `<div class="topic-placeholder"><p class="modal-kicker">02 / PERSONAL ARCHIVE</p><h2>${el.dataset.topic}</h2><p>该档案入口已经建立，详细内容将在下一阶段完成。</p></div>`;
  modal.showModal();
}));
document.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
content.addEventListener('click', event => {
  const archiveIndex = event.target.closest('[data-archive-index]');
  if (archiveIndex) {
    modal.close();
    document.querySelector('#archive')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('.archive-list button')?.focus({ preventScroll: true });
    return;
  }
  const panelJump = event.target.closest('[data-panel-jump]');
  if (panelJump) {
    openPanel(panelJump.dataset.panelJump);
    return;
  }
  const next = event.target.closest('[data-next-topic]');
  if (!next) return;
  document.querySelector(`[data-topic="${next.dataset.nextTopic}"]`)?.click();
});
modal.addEventListener('pointerover', event => {
  const trait = event.target.closest('[data-trait-note]');
  if (trait && !trait.contains(event.relatedTarget)) {
    clearTimeout(trait._hideTimer);
    content.querySelectorAll('[data-trait-note].is-open').forEach(item => { if (item !== trait && !item.dataset.pinned) item.classList.remove('is-open'); });
    trait.classList.add('is-open');
  }
  const school = event.target.closest('.school-card');
  if (school && !school.contains(event.relatedTarget)) paperSound(0.48);
  const stage = event.target.closest('.character-stage');
  if (stage && !stage.contains(event.relatedTarget)) bubbleSound();
});
let restaurantSpeechTimer;
modal.addEventListener('pointerout', event => {
  const trait = event.target.closest('[data-trait-note]');
  if (trait && !trait.contains(event.relatedTarget) && !trait.dataset.pinned) {
    clearTimeout(trait._hideTimer);
    trait._hideTimer = setTimeout(() => trait.classList.remove('is-open'), 150);
  }
  const stage = event.target.closest('.character-stage');
  if (!stage || stage.contains(event.relatedTarget) || stage.classList.contains('is-pinned')) return;
  clearTimeout(restaurantSpeechTimer);
  restaurantSpeechTimer = setTimeout(() => {
    stage.classList.remove('is-speaking');
    stage.setAttribute('aria-expanded', 'false');
  }, 200);
});
modal.addEventListener('pointerover', event => {
  const stage = event.target.closest('.character-stage');
  if (!stage || stage.contains(event.relatedTarget)) return;
  clearTimeout(restaurantSpeechTimer);
  stage.classList.add('is-speaking');
  stage.setAttribute('aria-expanded', 'true');
});
modal.addEventListener('click', event => {
  const trait = event.target.closest('[data-trait-note]');
  if (trait) {
    const willPin = trait.dataset.pinned !== 'true';
    content.querySelectorAll('[data-trait-note]').forEach(item => {
      if (item !== trait) {
        delete item.dataset.pinned;
        item.classList.remove('is-open');
      }
    });
    if (willPin) {
      trait.dataset.pinned = 'true';
      trait.classList.add('is-open');
    } else {
      delete trait.dataset.pinned;
      trait.classList.remove('is-open');
    }
    return;
  }
  const stage = event.target.closest('.character-stage');
  if (!stage) return;
  const pinned = !stage.classList.contains('is-pinned');
  stage.classList.toggle('is-pinned', pinned);
  stage.classList.toggle('is-speaking', pinned);
  stage.setAttribute('aria-expanded', String(pinned));
});

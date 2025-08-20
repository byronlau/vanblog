export default function FontTest() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 className="article-title">字体系统测试页面</h1>
      <p className="article-subtitle">展示完整的字体系统和文章排版效果</p>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>字体大小系统测试</h2>
        <div style={{ fontSize: 'var(--text-xs)' }}>text-xs (0.75rem / 12px)</div>
        <div style={{ fontSize: 'var(--text-sm)' }}>text-sm (0.875rem / 14px)</div>
        <div style={{ fontSize: 'var(--text-base)' }}>text-base (1rem / 16px)</div>
        <div style={{ fontSize: 'var(--text-lg)' }}>text-lg (1.125rem / 18px)</div>
        <div style={{ fontSize: 'var(--text-xl)' }}>text-xl (1.25rem / 20px)</div>
        <div style={{ fontSize: 'var(--text-2xl)' }}>text-2xl (1.5rem / 24px)</div>
        <div style={{ fontSize: 'var(--text-3xl)' }}>text-3xl (1.875rem / 30px)</div>
        <div style={{ fontSize: 'var(--text-4xl)' }}>text-4xl (2.25rem / 36px)</div>
        <div style={{ fontSize: 'var(--text-5xl)' }}>text-5xl (3rem / 48px)</div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>行高系统测试</h2>
        <div style={{ lineHeight: 'var(--leading-tight)', marginBottom: '1rem' }}>
          <strong>leading-tight (1.25):</strong> 这是一段测试文字，用来展示紧密行高的效果。这种行高适合大标题使用，能够让文字看起来更加紧凑。
        </div>
        <div style={{ lineHeight: 'var(--leading-snug)', marginBottom: '1rem' }}>
          <strong>leading-snug (1.375):</strong> 这是一段测试文字，用来展示适中行高的效果。这种行高适合中等标题使用，平衡了紧凑性和可读性。
        </div>
        <div style={{ lineHeight: 'var(--leading-normal)', marginBottom: '1rem' }}>
          <strong>leading-normal (1.5):</strong> 这是一段测试文字，用来展示标准行高的效果。这种行高适合界面文本使用，提供良好的可读性。
        </div>
        <div style={{ lineHeight: 'var(--leading-relaxed)', marginBottom: '1rem' }}>
          <strong>leading-relaxed (1.625):</strong> 这是一段测试文字，用来展示宽松行高的效果。这种行高适合正文阅读使用，能够减少眼部疲劳，提供舒适的阅读体验。
        </div>
        <div style={{ lineHeight: 'var(--leading-loose)', marginBottom: '1rem' }}>
          <strong>leading-loose (2):</strong> 这是一段测试文字，用来展示很宽松行高的效果。这种行高适合特殊强调使用，提供最大的垂直空间。
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>字体栈测试</h2>
        <div style={{ marginBottom: '1rem' }}>
          <strong>无衬线字体 (Sans-serif):</strong>
          <p style={{ fontFamily: 'var(--font-sans)' }}>
            这段文字使用无衬线字体显示。适用于界面元素、导航、按钮等。
          </p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>衬线字体 (Serif):</strong>
          <p style={{ fontFamily: 'var(--font-serif)' }}>
            这段文字使用衬线字体显示。适用于文章正文、长文本阅读等。
          </p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>等宽字体 (Monospace):</strong>
          <p style={{ fontFamily: 'var(--font-mono)' }}>
            这段文字使用等宽字体显示。适用于代码、终端输出等。
            console.log('Hello World');
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>间距系统测试</h2>
        <div>space-1 (0.25rem):</div>
        <div style={{ height: 'var(--space-1)', backgroundColor: '#e2e8f0', marginBottom: '0.5rem' }}></div>
        <div>space-2 (0.5rem):</div>
        <div style={{ height: 'var(--space-2)', backgroundColor: '#e2e8f0', marginBottom: '0.5rem' }}></div>
        <div>space-4 (1rem):</div>
        <div style={{ height: 'var(--space-4)', backgroundColor: '#e2e8f0', marginBottom: '0.5rem' }}></div>
        <div>space-8 (2rem):</div>
        <div style={{ height: 'var(--space-8)', backgroundColor: '#e2e8f0', marginBottom: '0.5rem' }}></div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>文章排版样式演示</h2>
        <div style={{ border: '1px solid #e2e8f0', padding: '2rem', borderRadius: '8px' }}>
          <h1 className="article-title">这是文章主标题</h1>
          <p className="article-subtitle">这是文章副标题，用来补充说明主标题的内容</p>
          
          <div className="article-content">
            <p>这是文章的首段，使用了特殊的样式。首段通常会比正文稍大一些，用来吸引读者的注意力。这段文字展示了首段的排版效果。</p>
            
            <p>这是正文段落。正文使用衬线字体，因为研究表明衬线字体在长时间阅读时可以减少眼部疲劳。行高设置为1.625，提供了足够的垂直空间，使文本更易于阅读。</p>
            
            <h1>一级标题 (H1)</h1>
            <p>一级标题使用衬线字体，30px 大小，紧密行高，适合文章的主要部分。</p>
            
            <h2>二级标题 (H2)</h2>
            <p>二级标题用于划分文章的主要章节，24px 大小，带有下边框。</p>
            
            <h3>三级标题 (H3)</h3>
            <p>三级标题用于进一步细分内容，20px 大小。</p>
            
            <h4>四级标题 (H4)</h4>
            <p>四级标题使用无衬线字体，18px 大小，与正文形成对比。</p>
            
            <h5>五级标题 (H5)</h5>
            <p>五级标题使用大写字母和增加的字间距，16px 大小。</p>
            
            <h6>六级标题 (H6)</h6>
            <p>六级标题是最小级别，14px 大小，使用大写和字间距。</p>
            
            <p>字体大小系统基于比例缩放，确保不同级别的标题之间有明确的视觉层次。这种层次结构帮助读者理解内容的组织方式，并能够快速浏览文章。</p>
          </div>
        </div>
      </div>

      <div>
        <h2>验证方法</h2>
        <p>打开浏览器开发者工具，检查以下内容：</p>
        <ul>
          <li>html 元素的 font-size 应该是 18px</li>
          <li>html 元素的 line-height 应该是 1.6</li>
          <li>各个测试元素应该显示对应的字体大小和行高</li>
          <li>H1-H3 标题应该使用衬线字体</li>
          <li>H4-H6 标题应该使用无衬线字体</li>
          <li>H5-H6 标题应该显示为大写字母</li>
          <li>H2 标题应该有下边框</li>
          <li>文章正文应该使用衬线字体和舒适的行高</li>
        </ul>
        <p>Console 验证命令：</p>
        <code>getComputedStyle(document.documentElement).fontSize</code><br/>
        <code>getComputedStyle(document.documentElement).lineHeight</code>
      </div>
    </div>
  );
}
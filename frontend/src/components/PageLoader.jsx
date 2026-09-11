const letters = 'TOOLKIT'.split('');

const PageLoader = () => (
  <div className="toolkit-loader" role="status" aria-label="Loading ToolKit">
    <div className="toolkit-loader__topline">
      <span>Hardware essentials</span>
      <span>Est. 2026</span>
    </div>
    <div className="toolkit-loader__wordmark" aria-hidden="true">
      {letters.map((letter, index) => (
        <span key={`${letter}-${index}`} style={{ '--letter-index': index }}>{letter}</span>
      ))}
    </div>
    <div className="toolkit-loader__footer">
      <span className="toolkit-loader__line" />
      <span>Your Own Personal ToolKit</span>
      <span className="toolkit-loader__line" />
    </div>
  </div>
);

export default PageLoader;

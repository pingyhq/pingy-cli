/* eslint-disable */
const AssetGraph = require('assetgraph');

(async () => {
  const assetGraph = new AssetGraph();
  const asset = assetGraph.addAsset({
    url: 'about.css',
    // type: 'Html',
    text: 'body { background: #fff }',
  });
  assetGraph
    .writeAssetsToDisc({ isLoaded: true }, 'file:///Users/dave/Desktop/test/')
    .run();
})();

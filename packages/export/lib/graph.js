'use strict';

const AssetGraph = require('assetgraph');
const path = require('path');
const urlTools = require('urltools');
const compile = require('@pingy/compile');
const flatMap = require('array.prototype.flatmap');
const { fixSources } = require('./helpers');
const globby = require('globby');
const pathCompleteExtname = require('path-complete-extname');
const EventEmitter = require('events');

class ExportProgressEmitter extends EventEmitter {}

const urlToPath = urlTools.fileUrlToFsPath.bind(urlTools);
const pathToUrl = urlTools.fsFilePathToFileUrl.bind(urlTools);
const buildRootRelativeUrl = (root, p) =>
  urlTools.buildRootRelativeUrl(root, pathToUrl(p), root);

let seenAssets;
let outputFileInfo;

async function loadCompiledAsset(sourcePath, assetGraph) {
  const sourceExtension = pathCompleteExtname(sourcePath);
  const targetPath = compile.findTargetFile(sourcePath);

  const compiled = await compile.read(sourcePath);

  const sourceAsset = await assetGraph
    .addAsset({
      url: pathToUrl(sourcePath),
    })
    .load();

  const rootRelativePath = buildRootRelativeUrl(assetGraph.root, targetPath);
  const compiledOutputFullPath = path.join(
    urlToPath(assetGraph.outputDir),
    rootRelativePath
  );

  const compiledObj = {
    url: pathToUrl(targetPath),
    text: compiled.result,
  };
  if (compiled.sourcemap && compiled.sourcemap.sources) {
    compiled.sourcemap.sources = fixSources(
      compiled.sourcemap.sources,
      urlToPath(assetGraph.root),
      urlToPath(assetGraph.outputDir),
      compiledOutputFullPath,
      true
    );
    compiledObj.sourceMap = compiled.sourceMap;
  }
  // console.log(compiled);
  if (compiled.extension === '.html') compiledObj.type = 'Html';
  // console.log(compiledObj);
  const transforms = [];
  const compiledAsset = await assetGraph.addAsset(compiledObj).load();
  transforms.push('compile');

  if (compiledAsset.minify) {
    compiledAsset.minify();
    transforms.push('minify');
  }
  compiledAsset.sourceExtension = sourceExtension;

  outputFileInfo.push({
    path: urlToPath(compiledAsset.url),
    transforms,
    sourceExtension,
  });

  return [sourceAsset, compiledAsset];
}

async function loadAsset(asset, assetGraph) {
  if (seenAssets.has(asset)) return Promise.resolve([]);
  seenAssets.add(asset);
  try {
    if (compile.canCompile(urlToPath(asset.url))) {
      return await loadCompiledAsset(urlToPath(asset.url), assetGraph, asset);
    }
    const loadedAsset = await asset.load();
    const transforms = [];
    if (loadedAsset.minify) {
      loadedAsset.minify();
      transforms.push('minify');
    }
    outputFileInfo.push({
      path: urlToPath(asset.url),
      transforms,
    });

    return [loadedAsset];
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.log(err);
      return [];
    }

    const sourceFile = await compile.findSourceFile(urlToPath(asset.url));
    if (!sourceFile) throw err;
    return loadCompiledAsset(sourceFile, assetGraph);
  }
}

async function recursiveAssetLoader(assets, assetGraph) {
  // console.log(Array.from(seenAssets).map(x => x.url));
  const assetCollection = await Promise.all(
    flatMap(assets, a => {
      if (!(a && a.outgoingRelations)) return [];
      return a.outgoingRelations.map(r => {
        if (!(r.hrefType === 'relative' || r.hrefType === 'rootRelative'))
          return [];
        const nextAsset = assetGraph.addAsset({
          url: r.to.url,
        });
        return loadAsset(nextAsset, assetGraph);
      });
    })
  );
  const flatAssetCollection = flatMap(assetCollection, x => x);

  if (flatAssetCollection.length)
    await recursiveAssetLoader(flatAssetCollection, assetGraph);
}

async function graph(root, entries, exportDir, progress) {
  seenAssets = new Set();
  outputFileInfo = [];
  progress.emit('glob');

  const assetGraph = new AssetGraph({ root });
  assetGraph.outputDir = exportDir;

  const matchedEntries = await globby(entries, { cwd: root });
  progress.emit('graph');

  const loadAssets = matchedEntries
    .map(fileName => assetGraph.addAsset(fileName))
    .map(asset => loadAsset(asset, assetGraph, true));
  const assets = await Promise.all(flatMap(loadAssets, x => x));
  const flatAssets = flatMap(assets, x => x);

  progress.emit('compile');
  await recursiveAssetLoader(flatAssets, assetGraph);

  progress.emit('minify');
  const minifyQuery = { type: 'Html', isLoaded: true };
  // assetGraph.on('warn', e => {
  //   console.log('warn', e);
  // });
  await assetGraph.minifyCss(minifyQuery);
  assetGraph.findAssets(minifyQuery).forEach(a => {
    if (!(a && a.url)) return;
    const i = outputFileInfo.findIndex(x => x.path === urlToPath(a.url));
    if (i >= 0) {
      const info = outputFileInfo[i];
      if (info && info.transforms) {
        outputFileInfo[i].transforms.push('minify');
      }
    }
  });

  progress.emit('sourceMaps');
  await assetGraph.serializeSourceMaps();

  assetGraph.findRelations({ type: 'SourceMapSource' }).forEach(r => {
    r.hrefType = 'relative';
  });
  // assetGraph.findAssets({ isMinified: true }).forEach(r => {
  //   console.log(r.url);
  // });

  progress.emit('write');
  await assetGraph
    .writeAssetsToDisc({ isLoaded: true }, assetGraph.outputDir)
    .run();
  return outputFileInfo;
}

// graph(
//   `${__dirname}/../examples/site`,
//   ['*.html'],
//   pathToUrl('/Users/dave/Desktop/test/')
// );

module.exports = (root, entries, exportDir) => {
  const progress = new ExportProgressEmitter();

  return {
    graph: graph(root, entries, exportDir, progress),
    progress,
  };
};

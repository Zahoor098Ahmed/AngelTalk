const fs = require('fs');
const smartFile = 'frontend/src/components/SmartImage.tsx';
let smart = fs.readFileSync(smartFile, 'utf8').replace(/\r\n/g, '\n');
smart = smart.replace('resizeMode = "contain", ...rest }: ImageProps)', 'resizeMode = "contain", original = false, ...rest }: ImageProps & { original?: boolean })');
smart = smart.replace('Platform.OS !== "web" || !uri', 'Platform.OS !== "web" || !uri || original');
smart = smart.replace('}, [uri]);', '}, [uri, original]);');
smart = smart.replace('const displaySource = uri && normalized?.original === uri', 'const displaySource = !original && uri && normalized?.original === uri');
fs.writeFileSync(smartFile, smart.trimEnd() + '\n');
const boardFile = 'frontend/src/screens/AACBoardScreen.tsx';
let board = fs.readFileSync(boardFile, 'utf8').replace(/\r\n/g, '\n');
board = board.replace('  categoryPictureFor,', '  categoryPictureFor,\n  folderEnglishName,');
board = board.replace('  fullSize = false,\n}: {', '  fullSize = false,\n  originalPhoto = false,\n}: {');
board = board.replace('  fullSize?: boolean;\n}) {', '  fullSize?: boolean;\n  originalPhoto?: boolean;\n}) {');
board = board.replace('        resizeMode={fullSize ? "cover" : "contain"}', '        resizeMode={fullSize ? "cover" : "contain"}\n        original={originalPhoto}');
const anchor = '  const current = currentId ? getCategory(currentId) : null;';
board = board.replace(anchor, anchor + `
  // Food photos keep their original framing throughout the entire shelf, in any language.
  const originalFoodPhotos = useMemo(() => {
    let category = current;
    const seen = new Set<string>();
    while (category && !seen.has(category.id)) {
      seen.add(category.id);
      const name = folderEnglishName(category).trim().toLowerCase();
      if (name === "food and drinks" || name === "foods and drinks") return true;
      category = category.parentCategoryId ? getCategory(category.parentCategoryId) : null;
    }
    return false;
  }, [current, tick]);`);
board = board.replace('<View style={styles.wordBody}>', '<View style={[styles.wordBody, originalFoodPhotos && { padding: 3 }]}>');
board = board.replaceAll('                          fullSize\n', '                          fullSize={!originalFoodPhotos}\n                          originalPhoto={originalFoodPhotos}\n');
board = board.replace('size={Math.round(Math.min(verbTileW * 0.86, 190))} fullSize />', 'size={Math.round(Math.min(verbTileW * 0.86, 190))} fullSize={!originalFoodPhotos} originalPhoto={originalFoodPhotos} />');
if (!smart.includes('original = false') || !board.includes('originalPhoto={originalFoodPhotos}')) throw Error('Restore did not apply');
fs.writeFileSync(boardFile, board);
console.log('Restored original Food and Drinks photo framing for all descendant folders.');

function extractLists(text: string) {
  const lines = text.split("\n");
  let inList = false;
  let result = "";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let currentHeader = "";

  lines.forEach((line) => {
    // if line contains **Remember:** then break the loop and return the result
    if (line.includes("**Remember:**")) {
      return result.trim();
    }

    // if the line include :** then break the loop and return the result
    if (line.includes(":**")) {
      return result.trim();
    }
    // Check if the line starts a new header
    if (line.startsWith("**") && line.endsWith("**:")) {
      currentHeader = line;
      result += "\n" + line + "\n";
      inList = false;
    }
    // Check if the line is a list item
    else if (line.trim().startsWith("*")) {
      if (!inList) {
        inList = true;
      }
      result += line + "\n";
    } else {
      inList = false;
    }
  });

  return result.trim();
}

export default extractLists;

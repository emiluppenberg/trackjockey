function convertTo64Subdivision(notes: string): string {
  const fLen = 64 / notes.length;
  let fNotes = "";
  let fIdx = 0;

  const formatNotes = (c: string) => {
    fNotes += c;
    for (let j = fIdx + 1; j < fLen + fIdx; j++) {
      fNotes += "-";
    }
    fIdx += fLen;
  };

  for (let i = 0; i < notes.length; i++) {
    const c = notes.charAt(i);
    switch (c) {
        case "(5/)"
      case "1":
        formatNotes(c);
        break;
      case "2":
        formatNotes(c);
        break;
      case "3":
        formatNotes(c);
        break;
      case "4":
        formatNotes(c);
        break;
      case "5":
        formatNotes(c);
        break;
      case "6":
        formatNotes(c);
        break;
      case "7":
        formatNotes(c);
        break;
      case "8":
        formatNotes(c);
        break;
      case "9":
        formatNotes(c);
        break;
      case "X":
        formatNotes(c);
        break;
      case "-":
        formatNotes(c);
        break;
      case ":":
        break;
      default:
        alert("Invalid note input (character) conversion");
        return "";
    }
  }
  return fNotes;
}
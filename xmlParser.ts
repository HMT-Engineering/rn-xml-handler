import { XMLTag } from "./xmlTag";
export class XMLParser {
  private static _parseFromString(xmlText: string) {
    xmlText = XMLParser._encodeCDATAValues(xmlText);
    let cleanXmlText = xmlText
      .replace(/\s{2,}/g, " ")
      .replace(/\\t\\n\\r/g, "")
      .replace(/>/g, ">\n")
      .replace(/\]\]/g, "]]\n");
    let rawXmlData: XMLTag[] = [];

    cleanXmlText.split("\n").map((element) => {
      element = element.trim();

      if (!element || element.indexOf("?xml") > -1) {
        return;
      }

      if (element.indexOf("<") == 0 && element.indexOf("CDATA") < 0) {
        let parsedTag = XMLParser._parseTag(element);
        if (parsedTag) {
          rawXmlData.push(parsedTag);

          if (element.match(/\/\s*>$/)) {
            let closingTag = XMLParser._parseTag("</" + parsedTag.name + ">");
            if (closingTag) {
              rawXmlData.push(closingTag);
            }
          }
        }
      } else {
        rawXmlData[rawXmlData.length - 1].value += ` ${XMLParser._parseValue(
          element
        )}`;
      }
    });

    return XMLParser._convertTagsArrayToTree(rawXmlData)[0];
  }

  private static _encodeCDATAValues(xmlText: string) {
    let cdataRegex = new RegExp(/<!\[CDATA\[([^\]\]]+)\]\]/gi);
    let result = cdataRegex.exec(xmlText);
    while (result) {
      if (result.length > 1) {
        xmlText = xmlText.replace(result[1], encodeURIComponent(result[1]));
      }

      result = cdataRegex.exec(xmlText);
    }

    return xmlText;
  }

  private static _parseTag(tagText: string): XMLTag | undefined {
    let cleanTagText = tagText.match(
      /([^\s]*)=('([^']*?)'|"([^"]*?)")|([\/?\w\-\:]+)/g
    );
    if (cleanTagText !== null && cleanTagText !== undefined) {
      let tag: XMLTag = new XMLTag(
        cleanTagText.shift()?.replace(/\/\s*$/, "") ?? ""
      );

      cleanTagText.map((attribute) => {
        let attributeKeyVal = attribute.split("=");

        if (attributeKeyVal.length < 2) {
          return;
        }

        let attributeKey = attributeKeyVal[0];
        let attributeVal = "";

        if (attributeKeyVal.length === 2) {
          attributeVal = attributeKeyVal[1];
        } else {
          attributeKeyVal = attributeKeyVal.slice(1);
          attributeVal = attributeKeyVal.join("=");
        }

        tag.attributes[attributeKey] = attributeVal
          .replace(/^"/g, "")
          .replace(/^'/g, "")
          .replace(/"$/g, "")
          .replace(/'$/g, "")
          .trim();
      });

      return tag;
    }
    return undefined;
  }

  private static _parseValue(tagValue: string) {
    if (tagValue.indexOf("CDATA") < 0) {
      return tagValue.trim();
    }

    return tagValue.substring(
      tagValue.lastIndexOf("[") + 1,
      tagValue.indexOf("]")
    );
  }

  private static _convertTagsArrayToTree(xml: XMLTag[]) {
    let xmlTree = [];

    while (xml.length > 0) {
      let tag = xml.shift();

      if (
        (tag?.value && tag.value.indexOf("</") > -1) ||
        tag?.name.match(/\/$/)
      ) {
        tag.name = tag.name.replace(/\/$/, "").trim();
        tag.value = tag.value.substring(0, tag.value.indexOf("</")).trim();
        xmlTree.push(tag);
        continue;
      }

      if (tag?.name.indexOf("/") == 0) {
        break;
      }
      if (tag) {
        xmlTree.push(tag);
        tag.children = XMLParser._convertTagsArrayToTree(xml);
        tag.value = decodeURIComponent(tag.value.trim());
      }
    }
    return xmlTree;
  }

  private static _toString(xml: XMLTag) {
    var xmlText = XMLParser._convertTagToText(xml);

    if (xml.children.length > 0) {
      xml.children.map((child) => {
        xmlText += XMLParser._toString(child);
      });

      xmlText += "</" + xml.name + ">";
    }

    return xmlText;
  }

  private static _convertTagToText(tag: XMLTag) {
    var tagText = "<" + tag.name;

    for (var attribute in tag.attributes) {
      tagText += " " + attribute + '="' + tag.attributes[attribute] + '"';
    }

    if (tag.value.length > 0) {
      tagText += ">" + tag.value;
    } else {
      tagText += ">";
    }

    if (tag.children.length === 0) {
      tagText += "</" + tag.name + ">";
    }

    return tagText;
  }

  static parseFromString(xmlText: string) {
    return XMLParser._parseFromString(xmlText);
  }

  static toString(xml: XMLTag) {
    return XMLParser._toString(xml);
  }
}

export class XMLTag {
  name: string;
  attributes: Record<string, string>;
  children: XMLTag[];
  value: string;
  constructor(
    name: string,
    attributes?: Record<string, string>,
    children?: XMLTag[],
    value?: string
  ) {
    this.name = name;
    this.attributes = attributes ?? {};
    this.children = children ?? [];
    this.value = value ?? "";
  }
  getElementsByTagName(tagName: string) {
    let matches: XMLTag[] = [];

    if (tagName == "*" || this.name?.toLowerCase() === tagName.toLowerCase()) {
      matches.push(this);
    }

    this.children?.map((child) => {
      if (child.getElementsByTagName) {
        matches = matches.concat(child.getElementsByTagName(tagName));
      }
    });

    return matches;
  }
}

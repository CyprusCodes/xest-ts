// Usage: {% sql %}
// Adapted from builtin tablerow tag
// https://github.com/harttle/liquidjs/blob/master/src/builtin/tags/tablerow.ts
import { format } from "sql-formatter";
import {
  Liquid,
  TagToken,
  TopLevelToken,
  Template,
  TagImpl,
  Context,
  Emitter,
} from "liquidjs";

function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err: Error) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

const registerTags = function (engine: Liquid): void {
  engine.registerTag("sql", {
    parse: function (
      this: TagImpl,
      tagToken: TagToken,
      remainTokens: TopLevelToken[]
    ): void {
      this.templates = [];
      let p: Template[] | undefined;
      const stream = this.liquid.parser
        .parseStream(remainTokens)
        .on("start", () => (p = this.templates))
        .on("tag:endsql", () => stream.stop())
        .on("template", (tpl: Template) => (p as Template[]).push(tpl))
        .on("end", () => {
          throw new Error(`sql ${tagToken.getText()} not closed`);
        });

      stream.start();
    },
    render: async function (
      this: TagImpl,
      ctx: Context,
      emitter: Emitter
    ): Promise<string> {
      const r: any = this.liquid.renderer;
      const stream = r.renderTemplatesToNodeStream(
        this.templates,
        ctx,
        emitter
      );
      const out = await streamToString(stream);
      return `${format(out)
        .split("\n")
        .map((i: string) => `  ${i}`)
        .join("\n")
        .replace(/\$\s\{/g, "${")}`.replace(/\${\s(.+)\s}/g, "${$1}");
    },
  });
};

export default registerTags;

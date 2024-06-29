import { Context, Schema, h } from 'koishi'

export const name = 'instagram'

export interface Config {
  host: string,
  key: string
}

export const Config = Schema.object({
  host: Schema.string().default('instagram-looter2.p.rapidapi.com').description('不需要做任何改动'),
  key: Schema.string().default('').description('填写从rapidapi获取的key'),
  description: Schema.string().default('请看readme教程获取对应的key').description(''),
})

export const GRAPH_SIDECAR = 'GraphSidecar';
export const GRAPH_IMAGE = 'GraphImage';
export const GRAPH_VIDEO = 'GraphVideo';

export function apply(ctx: Context, config: Config) {
  // write your plugin here

  async function fetchFromAPI(url: string) {
    const headers = {
      'X-RapidAPI-Key': config.key,
      'X-RapidAPI-Host': config.host
    };
    return await ctx.http.get('https://' + config.host + '/post?link=' + url, { headers });
  }

  ctx.middleware(async (session, next) => {
    if (!session.content.includes('instagram.com')) return next()

    try {
      const result = await fetchFromAPI(session.content);
      const {
        status,
        is_video,
        __typename
      } = result

      if (status !== true) {
        return '解析失败!';
      } else {
        switch (__typename) {
          case GRAPH_SIDECAR:
            const { edges } = result.edge_sidecar_to_children
            edges.forEach(async item => {
              if (item.node.is_video) {
                await session.send(h.video(item.node.video_url))
              } else {
                await session.send(h.image(item.node.display_url))
              }
            })
            break
          case GRAPH_IMAGE:
            session.send(h.image(result.display_url))
            break
          case GRAPH_VIDEO:
            session.send(h.video(result.video_url))
            break
        }
      }
    } catch(err) {
      console.log(err);
      return `发生错误!;  ${err}`;
    }
  })
}

import { WorkerEntrypoint } from "cloudflare:workers";

export interface Env {
  ASSETS: Fetcher
}

export default class extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    try {
      return await this.env.ASSETS.fetch(request);
    } catch (e) {
      try {
        const notFoundResponse = await this.env.ASSETS.fetch(new Request(new URL('/404.html', request.url).toString()));
        return new Response(notFoundResponse.body, {
          status: 404,
          headers: notFoundResponse.headers,
        });
      } catch (err) {
        return new Response("Not Found", { status: 404 });
      }
    }
  }
}
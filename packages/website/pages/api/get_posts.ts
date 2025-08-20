import type { NextApiRequest, NextApiResponse } from "next";
import { getArticlesByOption } from "../../api/getArticles";
import { Article } from "../../types/article";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ articles: Article[]; total: number } | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const tag = req.query.tag as string | undefined;
    const category = req.query.category as string | undefined;

    const data = await getArticlesByOption({
      page,
      pageSize,
      tags: tag,
      category: category,
      sortCreatedAt: "desc",
      toListView: true,
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

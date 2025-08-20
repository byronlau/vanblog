import { getPublicMeta } from "../../api/getAllData";
import AuthorCard, { AuthorCardProps } from "../../components/AuthorCard";
import Layout from "../../components/Layout";
import TimeLineItem from "../../components/TimeLineItem";
import { Article } from "../../types/article";
import { LayoutProps } from "../../utils/getLayoutProps";
import { getCategoryPagesProps } from "../../utils/getPageProps";
import { revalidate } from "../../utils/loadConfig";
export interface CategoryPagesProps {
  layoutProps: LayoutProps;
  authorCardProps: AuthorCardProps;
  curCategory: string;
  sortedArticles: Record<string, Article[]>;
  curNum: number;
  wordTotal: number;
}
import { getPublicMeta } from "../../api/getAllData";
import AuthorCard, { AuthorCardProps } from "../../components/AuthorCard";
import Layout from "../../components/Layout";
import TimeLineItem from "../../components/TimeLineItem";
import { Article } from "../../types/article";
import { LayoutProps } from "../../utils/getLayoutProps";
import { getCategoryPagesProps } from "../../utils/getPageProps";
import { revalidate } from "../../utils/loadConfig";
import { useState } from "react";
import { washArticlesByKey } from "../../utils/washArticles";

export interface CategoryPagesProps {
  layoutProps: LayoutProps;
  authorCardProps: AuthorCardProps;
  curCategory: string;
  sortedArticles: Record<string, Article[]>;
  curNum: number;
  wordTotal: number;
}

const CategoryPages = (props: CategoryPagesProps) => {
  const [posts, setPosts] = useState(props.sortedArticles);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;
    try {
      const res = await fetch(
        `/api/get_posts?page=${nextPage}&pageSize=10&category=${props.curCategory}`
      );
      const data = await res.json();

      if (data.articles && data.articles.length > 0) {
        const newPosts = washArticlesByKey(
          data.articles,
          (each) => new Date(each.createdAt).getFullYear(),
          false
        );

        setPosts((prevPosts) => {
          const mergedPosts = { ...prevPosts };
          for (const year in newPosts) {
            if (mergedPosts[year]) {
              mergedPosts[year] = [...mergedPosts[year], ...newPosts[year]];
            } else {
              mergedPosts[year] = newPosts[year];
            }
          }
          return mergedPosts;
        });

        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch more posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      option={props.layoutProps}
      title={props.curCategory}
      sideBar={<AuthorCard option={props.authorCardProps}></AuthorCard>}
    >
      <div className="bg-white card-shadow dark:bg-dark dark:card-shadow-dark py-4 px-8 md:py-6 md:px-8">
        <div>
          <div className="text-2xl md:text-3xl text-gray-700 text-center dark:text-dark">
            {props.curCategory}
          </div>
          <div className="text-center text-gray-600 text-sm mt-2 mb-4 font-light dark:text-dark">{`${props.curNum} 文章 × ${props.wordTotal} 字`}</div>
        </div>
        <div className="flex flex-col mt-2">
          {Object.keys(posts)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map((eachDate: string) => {
              return (
                <TimeLineItem
                  openArticleLinksInNewWindow={
                    props.layoutProps.openArticleLinksInNewWindow == "true"
                  }
                  defaultOpen={true}
                  key={eachDate}
                  date={eachDate}
                  articles={posts[eachDate]}
                ></TimeLineItem>
              );
            })}
        </div>
        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={loadMorePosts}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? "加载中..." : "加载更多"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryPages;
export async function getStaticPaths() {
  const data = await getPublicMeta();

  const paths = data.meta.categories.map((category) => ({
    params: {
      category: category,
    },
  }));

  return {
    paths,
    fallback: "blocking",
  };
}
export async function getStaticProps({
  params,
}: any): Promise<{ props: CategoryPagesProps; revalidate?: number }> {
  return {
    props: await getCategoryPagesProps(params.category),
    ...revalidate,
  };
}

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import AlertCard from "../AlertCard";
import CopyRight from "../CopyRight";
import Reward from "../Reward";
import UnLockCard from "../UnLockCard";
import WaLine from "../WaLine";
import { PostBottom } from "./bottom";
import { Title } from "./title";
import { getTarget } from "../Link/tools";
import TocMobile from "../TocMobile";
import { hasToc } from "../../utils/hasToc";
import Markdown from "../Markdown";
import { encodeQuerystring } from "../../utils/encode";
import PostViewer from "../PostViewer";

export default function PostCard(props: {
  id: number | string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  catelog: string;
  content: string;
  setContent: (content: string) => void;
  type: "overview" | "article" | "about";
  pay?: string[];
  payDark?: string[];
  author?: string;
  tags?: string[];
  next?: { id: number; title: string; pathname?: string };
  pre?: { id: number; title: string; pathname?: string };
  enableComment: "true" | "false";
  top: number;
  private: boolean;
  showDonateInAbout?: boolean;
  hideDonate?: boolean;
  hideCopyRight?: boolean;
  openArticleLinksInNewWindow: boolean;
  copyrightAggreement: string;
  customCopyRight: string | null;
  showExpirationReminder: boolean;
  showEditButton: boolean;
}) {
  const [lock, setLock] = useState(props.type != "overview" && props.private);
  const [defaultImage, setDefaultImage] = useState<string>("");
  const [imageHeight, setImageHeight] = useState<number>(256);
  const { content, setContent } = props;

  const showDonate = useMemo(() => {
    if (lock) {
      return false;
    }
    if (props.hideDonate) {
      return false;
    }
    if (!props.pay || props.pay.length <= 0) {
      return false;
    }
    if (props.type == "article") {
      return true;
    }
    if (props.type == "about" && props.showDonateInAbout) {
      return true;
    }
    return false;
  }, [props, lock]);

  // 提取文章开头的第一张图片作为封面
  const extractFirstImage = useMemo(() => {
    if (!content) {
      return null;
    }

    const imgPatterns = [
      /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i,
      /!\[.*?\]\(([^)]+)\)/,
      /<img[^>]*src\s*=\s*["']?([^"'\s>]+)["']?[^>]*>/i
    ];

    for (const pattern of imgPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1].trim();
        
        if (imageUrl.startsWith('/')) {
          imageUrl = window.location.origin + imageUrl;
        } else if (!imageUrl.startsWith('http')) {
          continue;
        }
        
        return imageUrl;
      }
    }
    
    return null;
  }, [content]);

  const calContent = useMemo(() => {
    let processedContent = content;
    
    if (extractFirstImage) {
      const imgPatterns = [
        new RegExp(`<img[^>]+src\\s*=\\s*["']${extractFirstImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i'),
        new RegExp(`!\\[.*?\\]\\(${extractFirstImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'i'),
        /<img[^>]*>/i
      ];
      
      for (const pattern of imgPatterns) {
        const match = processedContent.match(pattern);
        if (match && match[0].includes(extractFirstImage)) {
          processedContent = processedContent.replace(pattern, '').trim();
          break;
        }
      }
    }
    
    if (props.type == "overview") {
      if (props.private) {
        return "该文章已加密，点击 `阅读全文` 并输入密码后方可查看。";
      }
      const r = processedContent.split("<!-- more -->");
      if (r.length > 1) {
        return r[0].trim();
      } else {
        const textOnly = processedContent.replace(/<[^>]*>/g, '').trim();
        return textOnly.substring(0, 120) + (textOnly.length > 120 ? '...' : '');
      }
    } else {
      return processedContent.replace("<!-- more -->", "");
    }
  }, [props, lock, content, extractFirstImage]);

  const showToc = useMemo(() => {
    if (!hasToc(props.content)) return false;
    if (props.type == "article") return true;
    return false;
  }, [props.type, props.content]);

  useEffect(() => {
    if (!extractFirstImage) {
      fetch("https://60s.viki.moe/v2/bing")
        .then(response => response.json())
        .then(data => {
          if (data.code === 200 && data.data && data.data.cover) {
            setDefaultImage(data.data.cover);
          } else {
            setDefaultImage("https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg");
          }
        })
        .catch(() => {
          setDefaultImage("https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg");
        });
    }
  }, [extractFirstImage]);

  const finalImageUrl = extractFirstImage || defaultImage;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const originalHeight = img.naturalHeight;
    const originalWidth = img.naturalWidth;
    const containerWidth = img.offsetWidth;
    
    let finalHeight;
    
    if (originalWidth > containerWidth) {
      finalHeight = (originalHeight * containerWidth) / originalWidth;
    } else {
      finalHeight = originalHeight;
    }
    
    const maxHeight = props.type === "overview" ? 350 : 450;
    const minHeight = props.type === "overview" ? 200 : 220;
    
    finalHeight = Math.max(minHeight, Math.min(maxHeight, finalHeight));
    setImageHeight(finalHeight);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const fallbackUrl = "https://60s.viki.moe/v2/bing";
    
    if (!e.currentTarget.src.includes('60s.viki.moe')) {
      fetch(fallbackUrl)
        .then(response => response.json())
        .then(data => {
          if (data.code === 200 && data.data && data.data.cover) {
            e.currentTarget.src = data.data.cover;
          } else {
            e.currentTarget.src = "https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg";
          }
        })
        .catch(() => {
          e.currentTarget.src = "https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg";
        });
    }
  };

  return (
    <div className="post-card-wrapper">
      <div
        style={{ position: "relative" }}
        id="post-card"
        className="overflow-hidden post-card bg-white card-shadow rounded-lg dark:bg-dark dark:nav-shadow-dark flex flex-col"
      >
        {/* 图片区域 */}
        <div 
          className="relative w-full bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-t-lg flex-shrink-0"
          style={{ height: `${imageHeight}px` }}
        >
          {finalImageUrl ? (
            props.type === "overview" ? (
              <Link
                href={`/post/${props.id}`}
                target={getTarget(props.openArticleLinksInNewWindow)}
                className="block w-full h-full"
              >
                <img 
                  src={finalImageUrl}
                  alt={props.title}
                  className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90 cursor-pointer"
                  loading="lazy"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </Link>
            ) : (
              <img 
                src={finalImageUrl}
                alt={props.title}
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )
          ) : (
            props.type === "overview" ? (
              <Link
                href={`/post/${props.id}`}
                target={getTarget(props.openArticleLinksInNewWindow)}
                className="block w-full h-full"
              >
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center hover:from-gray-400 hover:to-gray-500 transition-colors cursor-pointer">
                  <span className="text-gray-600 text-lg">📷</span>
                </div>
              </Link>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <span className="text-gray-600 text-lg">📷</span>
              </div>
            )
          )}
          
          {/* 置顶标识 - 浮在图片左上角 */}
          {props.top != 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
              📌 置顶
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-4 flex flex-col">
          <Title
            type={props.type}
            id={props.id}
            title={props.title}
            openArticleLinksInNewWindow={props.openArticleLinksInNewWindow}
            showEditButton={props.showEditButton}
          />

          {/* 响应式信息布局 */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {/* PC端：一行显示 */}
            <div className="hidden md:flex md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                {/* 日期 */}
                <div className="flex items-center space-x-1">
                  <span>📅</span>
                  <span className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                    {props.type != "about" 
                      ? dayjs(props.createdAt).format("MM-DD")
                      : dayjs(props.updatedAt).format("MM-DD")}
                  </span>
                </div>
                
                {/* 分类 */}
                {props.type != "about" && (
                  <div className="flex items-center space-x-1">
                    <span>📁</span>
                    <Link
                      href={`/category/${encodeQuerystring(props.catelog)}`}
                      target={getTarget(props.openArticleLinksInNewWindow)}
                    >
                      <span className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded text-xs cursor-pointer transition-colors">
                        {props.catelog}
                      </span>
                    </Link>
                  </div>
                )}

                {/* 标签 */}
                {props.tags && props.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>🏷️</span>
                    {props.tags.slice(0, 5).map((tag, index) => {
                      const colors = [
                        'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200',
                        'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200',
                        'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200',
                        'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-200',
                        'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                      ];
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <Link
                          key={`tag-${tag}`}
                          href={`/tag/${encodeQuerystring(tag)}`}
                          target={getTarget(props.openArticleLinksInNewWindow)}
                        >
                          <span className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${colorClass}`}>
                            {tag}
                          </span>
                        </Link>
                      );
                    })}
                    {props.tags.length > 5 && (
                      <span className="text-gray-400">+{props.tags.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 阅读量 */}
                <span className="flex items-center">
                  👁️ <PostViewer shouldAddViewer={props.type != "overview"} id={props.id} />
                </span>
                
                {/* 评论数 */}
                {props.enableComment != "false" && (
                  <span className="flex items-center">
                    💬 <span className="waline-comment-count" data-path={props.type == "about" ? "/about" : "/post/" + props.id}>0</span>
                  </span>
                )}
              </div>
            </div>

            {/* 移动端：分两行显示 */}
            <div className="md:hidden">
              {/* 第一行：日期、分类、标签 */}
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {/* 日期 */}
                <div className="flex items-center space-x-1">
                  <span>📅</span>
                  <span className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                    {props.type != "about" 
                      ? dayjs(props.createdAt).format("MM-DD")
                      : dayjs(props.updatedAt).format("MM-DD")}
                  </span>
                </div>
                
                {/* 分类 */}
                {props.type != "about" && (
                  <div className="flex items-center space-x-1">
                    <span>📁</span>
                    <Link
                      href={`/category/${encodeQuerystring(props.catelog)}`}
                      target={getTarget(props.openArticleLinksInNewWindow)}
                    >
                      <span className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded text-xs cursor-pointer transition-colors">
                        {props.catelog}
                      </span>
                    </Link>
                  </div>
                )}

                {/* 标签 */}
                {props.tags && props.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>🏷️</span>
                    {props.tags.slice(0, 2).map((tag, index) => {
                      const colors = [
                        'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200',
                        'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                      ];
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <Link
                          key={`tag-${tag}`}
                          href={`/tag/${encodeQuerystring(tag)}`}
                          target={getTarget(props.openArticleLinksInNewWindow)}
                        >
                          <span className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${colorClass}`}>
                            {tag}
                          </span>
                        </Link>
                      );
                    })}
                    {props.tags.length > 2 && (
                      <span className="text-gray-400">+{props.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* 第二行：阅读量和评论数 */}
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  👁️ <PostViewer shouldAddViewer={props.type != "overview"} id={props.id} />
                </span>
                {props.enableComment != "false" && (
                  <span className="flex items-center">
                    💬 <span className="waline-comment-count" data-path={props.type == "about" ? "/about" : "/post/" + props.id}>0</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            {props.type == "article" && (
              <AlertCard
                showExpirationReminder={props.showExpirationReminder}
                updatedAt={props.updatedAt}
                createdAt={props.createdAt}
              />
            )}
            {lock ? (
              <UnLockCard
                setLock={setLock}
                setContent={setContent}
                id={props.id}
              />
            ) : (
              <>
                {showToc && <TocMobile content={calContent} />}
                <Markdown content={calContent} />
              </>
            )}
          </div>

          {showDonate && props.pay && (
            <Reward
              aliPay={(props?.pay as any)[0]}
              weChatPay={(props?.pay as any)[1]}
              aliPayDark={(props?.payDark || ["", ""])[0]}
              weChatPayDark={(props?.payDark || ["", ""])[1]}
              author={props.author as any}
              id={props.id}
            />
          )}
          {props.type == "article" && !lock && !props?.hideCopyRight && (
            <CopyRight
              customCopyRight={props.customCopyRight}
              author={props.author as any}
              id={props.id}
              showDonate={showDonate}
              copyrightAggreement={props.copyrightAggreement}
            />
          )}

          <PostBottom
            type={props.type}
            lock={lock}
            tags={props.tags}
            next={props.next}
            pre={props.pre}
            openArticleLinksInNewWindow={props.openArticleLinksInNewWindow}
          />
          <div
            style={{
              height: props.type == "about" && !showDonate ? "16px" : "0",
            }}
          />
        </div>
      </div>
      {props.type != "overview" && (
        <WaLine enable={props.enableComment} visible={true} />
      )}
    </div>
  );
}
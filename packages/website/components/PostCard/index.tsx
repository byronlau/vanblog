import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  const [imageHeight, setImageHeight] = useState<number>(300); // 桌面端固定300px
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 容器 ref + 宽度状态（由 ResizeObserver 驱动）
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // 用于中断 fetch 的 ref（在组件卸载时 abort）
  const fetchAbortRef = useRef<AbortController | null>(null);

  const { content, setContent } = props;

  const showDonate = useMemo(() => {
    if (lock) return false;
    if (props.hideDonate) return false;
    if (!props.pay || props.pay.length <= 0) return false;
    if (props.type === "article") return true;
    if (props.type === "about" && props.showDonateInAbout) return true;
    return false;
  }, [lock, props.hideDonate, props.pay, props.type, props.showDonateInAbout]);

  // 统一的标签颜色类（更一致的明暗对比）
  const tagColorClasses = [
    'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200',
    'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900 dark:text-rose-200',
    'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200',
    'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200',
    'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-200'
  ];

  const getTagClass = (index: number) => tagColorClasses[index % tagColorClasses.length];

  // 提取文章开头的第一张图片作为封面（SSR-safe：不在 useMemo 中访问 window）
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

        // 如果是以 / 开头的相对路径，不在这里拼 origin（避免 SSR 访问 window）
        // 后续在客户端将会把相对路径转换为绝对路径（见 finalImageUrl）
        if (!imageUrl.startsWith('http')) {
          // 仅接受以 '/' 开头的相对路径，其他非 http 的忽略
          if (imageUrl.startsWith('/')) {
            return imageUrl;
          }
          continue;
        }

        return imageUrl;
      }
    }

    return null;
  }, [content]);

  // finalImageUrl：在客户端把相对路径转换为绝对路径，否则使用 extractFirstImage 或默认图
  const finalImageUrl = useMemo(() => {
    if (extractFirstImage) {
      if (extractFirstImage.startsWith('/') && typeof window !== 'undefined') {
        return window.location.origin + extractFirstImage;
      }
      return extractFirstImage;
    }
    return defaultImage;
  }, [extractFirstImage, defaultImage]);

  const calContent = useMemo(() => {
    let processedContent = content;

    if (extractFirstImage) {
      const escaped = extractFirstImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const imgPatterns = [
        new RegExp(`<img[^>]+src\\s*=\\s*["']${escaped}["'][^>]*>`, 'i'),
        new RegExp(`!\\[.*?\\]\\(${escaped}\\)`, 'i'),
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

    if (props.type === "overview") {
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
  }, [content, extractFirstImage, props.type, props.private, lock]);

  const showToc = useMemo(() => {
    if (!hasToc(content)) return false;
    if (props.type === "article") return true;
    return false;
  }, [props.type, content]);

  // 拉取默认图（带 AbortController，防止卸载时泄漏）
  useEffect(() => {
    if (extractFirstImage) return;
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    fetch("https://60s.viki.moe/v2/bing", { signal: ac.signal })
      .then(response => response.json())
      .then(data => {
        if (data && data.code === 200 && data.data && data.data.cover) {
          setDefaultImage(data.data.cover);
        } else {
          setDefaultImage("https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg");
        }
      })
      .catch((err) => {
        if ((err && (err.name === 'AbortError' || err.name === 'DOMException'))) return;
        setDefaultImage("https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg");
      });

    return () => {
      ac.abort();
      fetchAbortRef.current = null;
    };
  }, [extractFirstImage]);

  // ResizeObserver：监听容器尺寸，设置 containerWidth 与 isMobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = containerRef.current;
    if (!el) return;

    const ro = new (window as any).ResizeObserver((entries: any[]) => {
      for (const entry of entries) {
        const w = entry.contentRect ? entry.contentRect.width : (entry.target as HTMLElement).offsetWidth;
        setContainerWidth(w);
        setIsMobile(w < 768);
      }
    });

    // 先用现有宽度初始化
    const rect = el.getBoundingClientRect();
    if (rect && rect.width) {
      setContainerWidth(rect.width);
      setIsMobile(rect.width < 768);
    }

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 计算图片高度（useCallback）
  const calculateImageHeight = useCallback((img: HTMLImageElement, usedWidth?: number) => {
    if (!isMobile) {
      return 300; // 桌面端固定300px
    }

    const originalHeight = img.naturalHeight || 1;
    const originalWidth = img.naturalWidth || 1;
    const containerW = usedWidth || containerWidth || Math.min((typeof window !== 'undefined' ? window.innerWidth : 400) - 32, 400);

    return (originalHeight * containerW) / originalWidth;
  }, [isMobile, containerWidth]);

  // 图片加载完成处理（useCallback）
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const newHeight = calculateImageHeight(img);
    setImageHeight(newHeight);
  }, [calculateImageHeight]);

  // 处理缓存图片的高度计算（仅在客户端执行）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (finalImageUrl && isMobile) {
      const img = new Image();
      img.onload = () => {
        const usedWidth = containerWidth || Math.min(window.innerWidth - 32, 400);
        const originalHeight = img.naturalHeight || 1;
        const originalWidth = img.naturalWidth || 1;

        const calculatedHeight = (originalHeight * usedWidth) / originalWidth;
        setImageHeight(calculatedHeight);
      };
      img.src = finalImageUrl;
    } else if (!isMobile) {
      // 桌面端固定300px
      setImageHeight(300);
    }
  }, [finalImageUrl, isMobile, containerWidth]);

  // 图片错误处理（useCallback），使用 AbortController 保护网络请求；只尝试一次回退
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget as HTMLImageElement;

    if (imgEl.dataset.fallbackTried === '1') {
      imgEl.src = "https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg";
      return;
    }

    imgEl.dataset.fallbackTried = '1';
    const fallbackUrl = "https://60s.viki.moe/v2/bing";
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    try {
      if (!imgEl.src.includes('60s.viki.moe')) {
        fetch(fallbackUrl, { signal: ac.signal })
          .then(response => response.json())
          .then(data => {
            if (data && data.code === 200 && data.data && data.data.cover) {
              imgEl.src = data.data.cover;
            } else {
              imgEl.src = "https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg";
            }
          })
          .catch((err) => {
            if (err && err.name === 'AbortError') return;
            imgEl.src = "https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg";
          })
          .finally(() => {
            fetchAbortRef.current = null;
          });
      } else {
        imgEl.src = "https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg";
      }
    } catch {
      imgEl.src = "https://cn.bing.com/th?id=OHR.SpottedEagleRay_ZH-CN9894613260_1920x1080.jpg&rf=LaDigue_1920x1080.jpg";
      fetchAbortRef.current = null;
    }
  }, []);

  // 组件卸载时中断未完成的 fetch
  useEffect(() => {
    return () => {
      if (fetchAbortRef.current) {
        try { fetchAbortRef.current.abort(); } catch {}
        fetchAbortRef.current = null;
      }
    };
  }, []);

  return (
    <div className="post-card-wrapper" ref={containerRef}>
      {/* 文章卡片 - 语义化结构 */}
      <article
        id="post-card"
        className="overflow-hidden post-card bg-white card-shadow rounded-lg dark:bg-dark dark:nav-shadow-dark dark:text-gray-100 flex flex-col"
        role="article"
        aria-labelledby={`post-title-${props.id}`}
      >
        {props.type === "overview" ? (
          /* 列表页面：整个卡片内容在一个容器内 */
          <div
            className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => {
              const target = getTarget(props.openArticleLinksInNewWindow);
              if (target === "_blank") {
                window.open(`/post/${props.id}`, "_blank");
              } else {
                window.location.href = `/post/${props.id}`;
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const target = getTarget(props.openArticleLinksInNewWindow);
                if (target === "_blank") {
                  window.open(`/post/${props.id}`, "_blank");
                } else {
                  window.location.href = `/post/${props.id}`;
                }
              }
            }}
            aria-label={`阅读文章: ${props.title}`}
          >
            {/* 图片区域 */}
            <div
              className="relative w-full bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-t-lg flex-shrink-0"
              style={{ height: `${imageHeight}px` }}
            >
              {finalImageUrl ? (
                <img
                  src={finalImageUrl}
                  alt={props.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  loading="lazy"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-600 text-lg">📷</span>
                </div>
              )}

              {/* 置顶标识 - 浮在图片左上角，只在列表页面显示 */}
              {props.top != 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                  📌 置顶
                </div>
              )}
            </div>

            {/* 内容区域 */}
            <div className="p-4 flex flex-col">
              {/* 标题区：标题左对齐，编辑按钮固定在最右侧（列表 & 详情 统一） */}
              <div className="w-full flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Title
                    type={props.type}
                    id={props.id}
                    title={props.title}
                    openArticleLinksInNewWindow={props.openArticleLinksInNewWindow}
                    // 统一在外部渲染编辑按钮，Title 内部不展示
                    showEditButton={false}
                  />
                </div>

                {props.showEditButton && (
                  <button
                    aria-label={`编辑 ${props.title}`}
                    onClick={(e) => {
                      // 阻止外层卡片点击导航（列表项为可点击容器）
                      e.stopPropagation();
                      const target = getTarget(props.openArticleLinksInNewWindow);
                      const editPath = `/post/${props.id}/edit`;
                      if (target === "_blank") {
                        window.open(editPath, "_blank");
                      } else {
                        window.location.href = editPath;
                      }
                    }}
                    className="ml-3 flex-shrink-0 text-base font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    编辑
                  </button>
                )}
              </div>

              {/* 简化的信息显示 - 列表页面无交互Link */}
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 日期（图标与值分离） */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs" aria-hidden>📅</span>
                      <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                        {dayjs(props.createdAt).format("YYYY-MM-DD")}
                      </span>
                    </div>

                    {/* 分类（图标与值分离） */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs" aria-hidden>📁</span>
                      <span className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded text-xs">
                        {props.catelog}
                      </span>
                    </div>

                    {/* 标签 */}
                    {props.tags && props.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">🏷️</span>
                        {!isMobile ? (
                          <>
                            {props.tags.slice(0, 5).map((tag, idx) => (
                              <span
                                key={`overview-tag-${tag}-${idx}`}
                                className={`${getTagClass(idx)} px-2 py-1 rounded text-xs`}
                              >
                                {tag}
                              </span>
                            ))}
                            {props.tags.length > 5 && (
                              <span className="text-gray-400 text-xs">+{props.tags.length - 5}</span>
                            )}
                          </>
                        ) : (
                          <span className={`${getTagClass(0)} px-2 py-1 rounded text-xs`}>
                            {props.tags[0]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-xs">
                      👁️ <PostViewer shouldAddViewer={false} id={props.id} />
                    </span>
                    {props.enableComment != "false" && (
                      <span className="flex items-center text-xs">
                        💬 <span className="waline-comment-count" data-path={`/post/${props.id}`}>0</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 文章内容预览 */}
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <Markdown content={calContent}></Markdown>
              </div>
            </div>
          </div>
        ) : (
          /* 详情页面：保持原有结构和功能 */
          <>
            {/* 图片区域 */}
            <div
              className="relative w-full bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-t-lg flex-shrink-0"
              style={{ height: `${imageHeight}px` }}
            >
              {finalImageUrl ? (
                <img
                  src={finalImageUrl}
                  alt={props.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  loading="lazy"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-600 text-lg">📷</span>
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

              {/* 完整的响应式信息布局 */}
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {/* PC端：一行显示 */}
                <div className="hidden md:flex md:items-center md:justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 日期 */}
                    <div className="flex items-center space-x-1">
                      <span>📅</span>
                      <span className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                        {props.type != "about"
                          ? dayjs(props.createdAt).format("YYYY-MM-DD")
                          : dayjs(props.updatedAt).format("YYYY-MM-DD")}
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
                        {props.tags.slice(0, 5).map((tag, index) => (
                          <Link
                            key={`tag-${tag}`}
                            href={`/tag/${encodeQuerystring(tag)}`}
                            target={getTarget(props.openArticleLinksInNewWindow)}
                          >
                            <span className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${getTagClass(index)}`}>
                              {tag}
                            </span>
                          </Link>
                        ))}
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
                    {/* 日期（移动端）：图标与值分开 */}
                    <div className="flex items-center">
                      <span className="text-xs mr-1" aria-hidden>📅</span>
                      <span className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                        {props.type != "about"
                          ? dayjs(props.createdAt).format("YYYY-MM-DD")
                          : dayjs(props.updatedAt).format("YYYY-MM-DD")}
                      </span>
                    </div>

                    {/* 分类（移动端）：图标与值分开 */}
                    {props.type != "about" && (
                      <div className="flex items-center">
                        <span className="text-xs mr-1" aria-hidden>📁</span>
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
                        {props.tags.slice(0, 2).map((tag, index) => (
                          <Link
                            key={`tag-${tag}`}
                            href={`/tag/${encodeQuerystring(tag)}`}
                            target={getTarget(props.openArticleLinksInNewWindow)}
                          >
                            <span className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${getTagClass(index)}`}>
                              {tag}
                            </span>
                          </Link>
                        ))}
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

              {/* 文章完整内容 */}
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {props.type == "article" && (
                  <AlertCard
                    showExpirationReminder={props.showExpirationReminder}
                    updatedAt={props.updatedAt}
                    createdAt={props.createdAt}
                  ></AlertCard>
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
                    <Markdown content={calContent}></Markdown>
                  </>
                )}
              </div>

              {/* 打赏组件 */}
              {showDonate && props.pay && (
                <Reward
                  aliPay={(props?.pay as any)[0]}
                  weChatPay={(props?.pay as any)[1]}
                  aliPayDark={(props?.payDark || ["", ""])[0]}
                  weChatPayDark={(props?.payDark || ["", ""])[1]}
                  author={props.author as any}
                  id={props.id}
                ></Reward>
              )}

              {/* 版权信息 */}
              {props.type == "article" && !lock && !props?.hideCopyRight && (
                <CopyRight
                  customCopyRight={props.customCopyRight}
                  author={props.author as any}
                  id={props.id}
                  showDonate={showDonate}
                  copyrightAggreement={props.copyrightAggreement}
                ></CopyRight>
              )}

              {/* 文章底部导航 */}
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
              ></div>
            </div>
          </>
        )}
      </article>

      {/* 评论组件 - 只在非列表页显示 */}
      {props.type != "overview" && (
        <WaLine enable={props.enableComment} visible={true} />
      )}
    </div>
  );
}
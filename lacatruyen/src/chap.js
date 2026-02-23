load('config.js');

function execute(url) {
    var fixedUrl = absoluteUrl(url).replace(/\/$/, "");
    var doc = getDoc(fixedUrl);
    var nextData = parseNextData(doc);

    var pageProps = nextData && nextData.props ? nextData.props.pageProps : null;
    var chapter = pageProps ? (pageProps.chapter || {}) : {};
    var content = chapter.content || chapter.chapter_content || chapter.content_html || "";

    if (!content) {
        content = doc.select("#chapter-content").html()
            || doc.select(".chapter-content").html()
            || doc.select(".content-wrap").html()
            || doc.select(".entry-content").html()
            || "";
    }

    if (!content) {
        return Response.error("Không thể đọc nội dung chương: " + fixedUrl);
    }

    content = content
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        .replace(/\u00a0/g, " ")
        .trim();

    var nextUrl = "";
    var chapterRight = pageProps ? pageProps.chapterRight : null;
    if (chapterRight && chapterRight.slug) {
        nextUrl = BASE_URL + "/chapter/" + chapterRight.slug;
    }

    if (!nextUrl) {
        nextUrl = doc.select("a[rel=next]").attr("href")
            || doc.select("a.next").attr("href")
            || "";
    }

    return Response.success(content, absoluteUrl(nextUrl));
}

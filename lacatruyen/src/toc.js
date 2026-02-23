load('config.js');

function execute(url) {
    var fixedUrl = absoluteUrl(url).replace(/\/$/, "");
    var doc = getDoc(fixedUrl);
    var nextData = parseNextData(doc);

    if (!nextData || !nextData.props || !nextData.props.pageProps) {
        return Response.error("Không thể đọc danh sách chương");
    }

    var firstChapterList = nextData.props.pageProps.firstChapter || [];
    if (!firstChapterList.length) {
        return Response.success([]);
    }

    var data = [];
    var seen = {};
    var currentSlug = firstChapterList[0].slug;
    var guard = 0;

    while (currentSlug && guard < 5000) {
        guard++;
        var chapterUrl = BASE_URL + "/chapter/" + currentSlug;
        if (seen[chapterUrl]) break;
        seen[chapterUrl] = true;

        var chapterDoc = getDoc(chapterUrl);
        var chapterData = parseNextData(chapterDoc);
        if (!chapterData || !chapterData.props || !chapterData.props.pageProps) break;

        var pageProps = chapterData.props.pageProps;
        var chapter = pageProps.chapter || {};
        var chapterTitle = chapter.title || currentSlug;

        data.push({
            name: chapterTitle,
            url: chapterUrl,
            host: BASE_URL
        });

        var chapterRight = pageProps.chapterRight;
        currentSlug = chapterRight ? chapterRight.slug : null;
    }

    return Response.success(data);
}

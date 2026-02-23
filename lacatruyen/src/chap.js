load('config.js');
load('crypto.js');

const APP_KEY_SEED = "G5sA7dL2K9fV3hQ1Zr8wX6pR0jN4uYtM7iC3vB9oS6xE2qLK-mKasbbZ";

function getAppCryptoKey() {
    var parts = APP_KEY_SEED.split("-");
    var left = parts[0] || "";
    var right = parts[1] || "";

    var shift = 0;
    for (var i = 0; i < right.length; i++) {
        shift += right.charCodeAt(i);
    }

    var output = "";
    for (var j = 0; j < left.length; j++) {
        var code = left.charCodeAt(j);
        output += String.fromCharCode((code - 65 + shift) % 26 + 65);
    }
    return output;
}

function decryptWithKey(value, key) {
    try {
        if (!value) return "";
        return CryptoJS.AES.decrypt(value, key).toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return "";
    }
}

function decrypt(value) {
    return decryptWithKey(value, getAppCryptoKey());
}

function decryptObject(obj) {
    var output = {};
    if (!obj) return output;

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            output[key] = decrypt(obj[key]);
        }
    }

    return output;
}

function extractChapterContent(pageProps) {
    var chapter = pageProps ? (pageProps.chapter || {}) : {};
    var rs = pageProps ? pageProps.rs : null;
    var ri = pageProps ? pageProps.ri : null;
    var commentCount = 0;
    if (pageProps && pageProps.comment_count) {
        if (typeof pageProps.comment_count === "number") {
            commentCount = pageProps.comment_count;
        } else if (Array.isArray(pageProps.comment_count) && pageProps.comment_count.length) {
            commentCount = pageProps.comment_count[0].count || 0;
        }
    }

    if (chapter.content && chapter.key_encrypt && rs && ri) {
        var decryptedRs = decryptObject(rs);
        var indexKey = decrypt(ri);
        var rsValue = decryptedRs[indexKey];
        if (!rsValue) {
            var firstKey = Object.keys(decryptedRs)[0];
            rsValue = firstKey ? decryptedRs[firstKey] : "";
        }

        var dynamicKey = decryptWithKey(chapter.key_encrypt, "" + (rsValue + commentCount));
        var content = decryptWithKey(chapter.content, dynamicKey);

        if (content && content.trim()) {
            return content;
        }

        var contentComp = decryptWithKey(chapter.content_comp, dynamicKey);
        if (contentComp && contentComp.trim()) {
            return contentComp;
        }
    }

    return chapter.content || chapter.chapter_content || chapter.content_html || chapter.content_comp || "";
}

function execute(url) {
    var fixedUrl = absoluteUrl(url).replace(/\/$/, "");
    var doc = getDoc(fixedUrl);
    var nextData = parseNextData(doc);

    var pageProps = nextData && nextData.props ? nextData.props.pageProps : null;
    var content = extractChapterContent(pageProps);

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

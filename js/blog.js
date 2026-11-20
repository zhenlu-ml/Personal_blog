// Pulls posts from the WordPress and Wix blogs (via rss2json) into the Blog page.
(function () {
  const FEEDS = [
    "https://tinybaozicom.wordpress.com/feed/",
    "https://cnzhenlu.wixsite.com/tinybaozi/blog-feed.xml",
  ];
  const PHOTO_LIMIT = 8;

  const grid = document.getElementById("image-grid");
  const moreBtn = document.getElementById("view-more");
  const list = document.getElementById("post-list");
  const status = document.getElementById("posts-status");

  const toText = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return (div.textContent || "").replace(/\s+/g, " ").trim();
  };

  const imagesOf = (item) => {
    const found = [];
    if (item.enclosure && item.enclosure.link) found.push(item.enclosure.link);
    const re = /<img[^>]+src="([^">]+)"/g;
    let m;
    while ((m = re.exec(item.content || "")) !== null) found.push(m[1]);
    // Skip author avatars and tracking pixels that WordPress adds to the feed.
    return found.filter((src) => !/gravatar\.com|pixel\.wp\.com|stats\.wp\.com/.test(src));
  };

  const fetchFeed = (url) =>
    fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(url))
      .then((r) => r.json())
      .then((d) => (d.status === "ok" ? d.items : []))
      .catch(() => []);

  Promise.all(FEEDS.map(fetchFeed)).then((results) => {
    const posts = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    if (!posts.length) {
      status.textContent = "Posts couldn't be loaded right now.";
      return;
    }
    status.remove();

    const seen = new Set();
    let count = 0;

    posts.forEach((item) => {
      const li = document.createElement("li");
      const date = document.createElement("div");
      date.className = "date";
      date.textContent = new Date(item.pubDate.replace(" ", "T")).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
      const h3 = document.createElement("h3");
      const a = document.createElement("a");
      a.href = item.link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = item.title;
      h3.appendChild(a);
      li.append(date, h3);

      const summary = toText(item.description);
      if (summary) {
        const p = document.createElement("p");
        p.textContent = summary.length > 180 ? summary.slice(0, 177) + "…" : summary;
        li.appendChild(p);
      }
      list.appendChild(li);

      imagesOf(item).forEach((src) => {
        if (seen.has(src)) return;
        seen.add(src);
        const link = document.createElement("a");
        link.href = item.link;
        link.target = "_blank";
        link.rel = "noopener";
        link.title = item.title;
        if (count >= PHOTO_LIMIT) link.classList.add("hidden");
        const img = document.createElement("img");
        img.src = src;
        img.alt = item.title;
        img.loading = "lazy";
        link.appendChild(img);
        grid.appendChild(link);
        count++;
      });
    });

    if (count === 0) document.getElementById("gallery").remove();
    if (count > PHOTO_LIMIT) {
      moreBtn.hidden = false;
      moreBtn.addEventListener("click", () => {
        grid.querySelectorAll("a.hidden").forEach((el) => el.classList.remove("hidden"));
        moreBtn.remove();
      });
    }
  });
})();

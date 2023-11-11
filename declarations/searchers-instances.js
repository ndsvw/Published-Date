class SearcherInstances {

    static GenerateMetaSearchers(metas) {
        return [
            new MetaSearcher(DateType.PUBLISHED, "article:published_time", metas, 100),
            new MetaSearcher(DateType.PUBLISHED, "created", metas, 100),
            new MetaSearcher(DateType.PUBLISHED, "available", metas, 95),
            new MetaSearcher(DateType.PUBLISHED, "dateAccepted", metas, 95),
            new MetaSearcher(DateType.PUBLISHED, "datePublished", metas, 100),
            new MetaSearcher(DateType.PUBLISHED, "dateCopyrighted", metas, 95),
            new MetaSearcher(DateType.PUBLISHED, "issued", metas, 100),

            new MetaSearcher(DateType.UPDATED, "article:modified_time", metas, 100),
            new MetaSearcher(DateType.UPDATED, "og:updated_time", metas, 100),
            new MetaSearcher(DateType.UPDATED, "modified", metas, 100),
            new MetaSearcher(DateType.UPDATED, "dateModified", metas, 100),
            new MetaSearcher(DateType.UPDATED, "updated_at", metas, 100), // microsoft.com
            new MetaSearcher(DateType.UPDATED, "revised", metas, 95),

            new MetaSearcher(DateType.PUBLISHEDORUPDATED, "date", metas, 95),
        ];
    }

    static GenerateJsonLdSearchers(json) {
        return [
            new JsonLdSearcher(DateType.PUBLISHED, "Answer", "datePublished", json, 90),
            new JsonLdSearcher(DateType.PUBLISHED, "Answer", "dateCreated", json, 90),
            new JsonLdSearcher(DateType.UPDATED, "Answer", "dateModified", json, 90),

            new JsonLdSearcher(DateType.PUBLISHED, "Article", "datePublished", json, 92.5),
            new JsonLdSearcher(DateType.PUBLISHED, "Article", "dateCreated", json, 92.5),
            new JsonLdSearcher(DateType.UPDATED, "Article", "dateModified", json, 92.5),

            new JsonLdSearcher(DateType.PUBLISHED, "BlogPosting", "datePublished", json, 92.5),
            new JsonLdSearcher(DateType.PUBLISHED, "BlogPosting", "dateCreated", json, 92.5),
            new JsonLdSearcher(DateType.UPDATED, "BlogPosting", "dateModified", json, 92.5),

            new JsonLdSearcher(DateType.PUBLISHED, "NewsArticle", "datePublished", json, 92.5),
            new JsonLdSearcher(DateType.PUBLISHED, "NewsArticle", "dateCreated", json, 92.5),
            new JsonLdSearcher(DateType.UPDATED, "NewsArticle", "dateModified", json, 92.5),

            new JsonLdSearcher(DateType.PUBLISHED, "QAPage", "datePublished", json, 92.5),
            new JsonLdSearcher(DateType.PUBLISHED, "QAPage", "dateCreated", json, 92.5),
            new JsonLdSearcher(DateType.UPDATED, "QAPage", "dateModified", json, 92.5),

            new JsonLdSearcher(DateType.PUBLISHED, "Question", "datePublished", json, 90),
            new JsonLdSearcher(DateType.PUBLISHED, "Question", "dateCreated", json, 90),
            new JsonLdSearcher(DateType.UPDATED, "Question", "dateModified", json, 90),

            new JsonLdSearcher(DateType.PUBLISHED, "WebPage", "datePublished", json, 95),
            new JsonLdSearcher(DateType.PUBLISHED, "WebPage", "dateCreated", json, 95),
            new JsonLdSearcher(DateType.UPDATED, "WebPage", "dateModified", json, 95),

            new JsonLdSearcher(DateType.PUBLISHED, "WebSite", "datePublished", json, 95),
            new JsonLdSearcher(DateType.PUBLISHED, "WebSite", "dateCreated", json, 95),
            new JsonLdSearcher(DateType.UPDATED, "WebSite", "dateModified", json, 95),

            new JsonLdSearcher(DateType.PUBLISHED, "JobPosting", "datePosted", json, 90),
            new JsonLdSearcher(DateType.PUBLISHED, "RealEstateListing", "datePosted", json, 90),
            new JsonLdSearcher(DateType.PUBLISHED, "SpecialAnnouncement", "datePosted", json, 90),

            new JsonLdSearcher(DateType.PUBLISHED, "MediaObject", "uploadDate", json, 90),

            new JsonLdSearcher(DateType.PUBLISHED, "Recipe", "datePublished", json, 75),
            new JsonLdSearcher(DateType.PUBLISHED, "Recipe", "dateCreated", json, 75),
            new JsonLdSearcher(DateType.UPDATED, "Recipe", "dateModified", json, 75),
        ];
    }
}
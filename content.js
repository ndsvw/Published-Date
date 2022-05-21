browser.runtime.onMessage.addListener(request => {
    if (request.query && request.query == "test-connection") {
        return Promise.resolve({ response: true });
    }
    if (request.query && request.query == "get-metas") {
        let metaTags = Array.from(document.head.querySelectorAll("meta"));
        let metasWithNameAttribute = metaTags
            .filter(x => x?.attributes?.name && x?.attributes?.content)
            .map(x => ({ name: x.attributes.name.value, content: x.attributes.content.value }));
        let metasWithPropertyAttribute = metaTags
            .filter(x => x?.attributes?.property && x?.attributes?.content)
            .map(x => ({ name: x.attributes.property.value, content: x.attributes.content.value }));
        let metasArray = metasWithNameAttribute.concat(metasWithPropertyAttribute);
        return Promise.resolve({ response: JSON.stringify(metasArray) });
    }
});

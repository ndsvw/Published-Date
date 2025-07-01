browser.runtime.onMessage.addListener(request => {
    if (request.query) {
        if (request.query == "test-connection") {
            return Promise.resolve({ response: true });
        }
        else if (request.query == "get-metas") {
            let metaTags = Array.from(document.querySelectorAll("meta"));
            let metasWithNameAttribute = metaTags
                .filter(x => x?.attributes?.name && x?.attributes?.content)
                .map(x => ({ name: x.attributes.name.value, content: x.attributes.content.value }));
            let metasWithPropertyAttribute = metaTags
                .filter(x => x?.attributes?.property && x?.attributes?.content)
                .map(x => ({ name: x.attributes.property.value, content: x.attributes.content.value }));
            let metasWithItempropAttribute = metaTags
                .filter(x => x?.attributes?.itemprop && x?.attributes?.content)
                .map(x => ({ name: x.attributes.itemprop.value, content: x.attributes.content.value }));
            let metasArray = metasWithNameAttribute.concat(metasWithPropertyAttribute).concat(metasWithItempropAttribute);
            return Promise.resolve({ response: JSON.stringify(metasArray) });
        }
        else if (request.query == "get-ld-jsons") {
            let jsons = Array.from(document.querySelectorAll("script[type='application/ld+json']"))
                .map(x => x.innerText);
            return Promise.resolve({ response: JSON.stringify(jsons) });
        }
        else if (request.query == "get-time-tag-datetimes") {
            let timeTags = Array.from(document.querySelectorAll("time[datetime]"))
                .map(x => x.attributes.datetime.value);
                console.log(timeTags);
            return Promise.resolve({ response: JSON.stringify(timeTags) });
        }
        else if (request.query == "get-script-tags") {
            let scriptTags = Array.from(document.querySelectorAll("script:not([type='application/ld+json'])"))
                .map(x => x.innerText);
            return Promise.resolve({ response: JSON.stringify(scriptTags) });
        }
    }
});

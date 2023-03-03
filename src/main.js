const tagTypeStorageKey = "wbnotes-tagtypes";
const tagStorageKey = "wbnotes-tags";
const dataEntryStorageKey = "wbnotes-dataentries";

const classActive = 'active';

/*
    Html-elements to access.
 */
const tagListElement = document.querySelector('.tag-list');
const notebookListElement = document.querySelector('.notebook-list');
const titleElement = document.querySelector('h1');
const textElement = document.querySelector('.text');
const tagsElement = document.querySelector('.tags');
const tagsSearchInput = document.getElementById('search-bar-input');
const tagsSearchResultContainer = document.getElementById('search-results-container');

/*
    Necessary global variables.
 */
let currentTextEntry;


/*
    Classes.
 */
class Tag {
    constructor(id, title) {
        this.id = id;
        this.title = title;
    }
}

class TextEntry {
    constructor(id, title, text, tagIds) {
        this.id = id;
        this.title = title;
        this.text = text;
        this.tagIds = tagIds;
    }
}

class SidebarEntry {
    constructor(id, title, textEntryId, parentTextEntryId) {
        this.id = id;
        this.title = title;
        this.textEntryId = textEntryId;
        this.parentTextEntryId = parentTextEntryId;
    }
}

class NoteKeeper {
    constructor() {
        this.tags = [];
        this.textEntries = [];
        this.sidebarEntries = [];
    }

    AddTag(title) {
        const id = GenerateGuid();
        const tag = new Tag(id, title);
        this.tags.push(tag);

        return tag;
    }

    AddTextEntry(title, text, tagIds) {
        const id = GenerateGuid();
        const textEntry = new TextEntry(id, title, text, tagIds);
        this.textEntries.push(textEntry);

        return textEntry;
    }

    AddSidebarEntry(title, textEntryId, parentTextEntryId = null) {
        const id = GenerateGuid();
        const sidebarEntry = new SidebarEntry(id, title, textEntryId, parentTextEntryId);
        this.sidebarEntries.push(sidebarEntry);

        return sidebarEntry;
    }

    GetTagById(id) {
        return this.tags.find((tag) => tag.id === id);
    }

    GetTagsByIds(tagIds) {
        const collectedTags = [];
        for (const tagId of tagIds) {
            const tag = this.tags.find(tag => tag.id === tagId);
            if (tag) {
                collectedTags.push(tag);
            }
        }
        return collectedTags;
    }

    GetTextEntryById(id) {
        return this.textEntries.find((textEntry) => textEntry.id === id);
    }

    GetSidebarEntriesByParentTextEntryId(parentTextEntryId) {
        return this.sidebarEntries.filter((sidebarEntry) => sidebarEntry.parentTextEntryId === parentTextEntryId);
    }

    GetTextEntriesByTagId(tagId) {
        return this.textEntries.filter((textEntry) => textEntry.tagIds.includes(tagId));
    }
}

/*
    Update the UI-element for the tag-list.
 */
function PopulateTagList() {
    tagListElement.innerHTML = '';
    const tags = noteKeeper.tags;
    for (const tag of tags) {
        tagListElement.appendChild(CreateTagElement(tag));
    }
}

/*
    Create a UI-element for a tag.
 */
function CreateTagElement(tag) {
    const tagElement = document.createElement('li');
    tagElement.innerHTML = tag.title;
    // Event listener to select tag.
    tagElement.addEventListener('click', () => {
        ShowNotebook(tag.id);
        tagListElement.querySelectorAll('li').forEach((li) => {
            li.classList.remove(classActive);
        });
        tagElement.classList.add(classActive);
    });

    return tagElement;
}

/*
    Update the UI-element for the notebook-list.
 */
function PopulateNotebookList(tagId) {
    notebookListElement.innerHTML = '';
    const textEntries = noteKeeper.GetTextEntriesByTagId(tagId);
    for (const textEntry of textEntries) {
        notebookListElement.appendChild(CreateNotebookElement(textEntry));
    }
}

/*
    Create a UI-element for a textEntry.
 */
function CreateNotebookElement(notebookEntry) {
    const notebookElement = document.createElement('li');
    notebookElement.textContent = notebookEntry.title;
    // Event listener to select notebook entry.
    notebookElement.addEventListener('click', () => {
        ShowTextEntry(notebookEntry.id);
        notebookListElement.querySelectorAll('li').forEach((li) => {
            li.classList.remove(classActive);
        });
        notebookElement.classList.add(classActive);
    });

    return notebookElement;
}

/*
    Show a notebook.
 */
function ShowNotebook(tagId) {
    PopulateNotebookList(tagId);
    titleElement.textContent = 'Notebook';
    titleElement.innerHTML = '';
}

/*
    Show a textEntry.
 */
function ShowTextEntry(textEntryId) {
    const textEntry = noteKeeper.GetTextEntryById(textEntryId);
    currentTextEntry = textEntry;
    titleElement.textContent = textEntry.title;
    textElement.innerHTML = textEntry.text;

    const tags = noteKeeper.GetTagsByIds(textEntry.tagIds);
    tagsElement.innerHTML = '';
    for (let tag of tags) {
        tagsElement.appendChild(CreateTextEntryTagButton(tag, textEntry));
    }
}

function CreateTextEntryTagButton(tag, textEntry) {
    let tagElement = document.createElement('button');
    tagElement.classList.add('tag');
    tagElement.innerHTML = tag.title;
    tagElement.addEventListener('click', () => {
        textEntry.tagIds.splice(textEntry.tagIds.indexOf(tag.id), 1);
        tagsElement.removeChild(tagElement);
    });

    return tagElement;
}

const noteKeeper = new NoteKeeper();

noteKeeper.AddTag('General');
noteKeeper.AddTag('Monster');
noteKeeper.AddTag('NPC');
noteKeeper.AddTag('Organization');
noteKeeper.AddTag('Deity');
noteKeeper.AddTag('Trader');
noteKeeper.AddTag('Pirate');
noteKeeper.AddTag('Leader');
noteKeeper.AddTag('Shop');
noteKeeper.AddTag('Building');
noteKeeper.AddTag('Settlement');


PopulateTagList();

noteKeeper.AddTextEntry('Test', 'Test', [noteKeeper.tags[0].id]);
noteKeeper.AddTextEntry('Test2', 'Test2', [noteKeeper.tags[0].id, noteKeeper.tags[1].id]);
noteKeeper.AddTextEntry('Test3', 'Test3', [noteKeeper.tags[0].id]);

function SearchSimilarStrings(value, list) {
    return list.filter(item => {
        return item.toLowerCase().includes(value.toLowerCase());
    });
}

function DisplayTagSuggestions(suggestions) {
    tagsSearchResultContainer.innerHTML = '';
    if (suggestions.length === 0) {
        tagsSearchResultContainer.style.display = 'none';
    } else {
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.classList.add('search-result');
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                tagsSearchInput.value = suggestion;
                tagsSearchResultContainer.style.display = 'none';
            });
            tagsSearchResultContainer.appendChild(div);
        });
        tagsSearchResultContainer.style.display = 'block';
    }
}

tagsSearchInput.addEventListener('input', () => {
    const value = tagsSearchInput.value.trim();
    const results = SearchSimilarStrings(value, noteKeeper.tags.map(tag => tag.title).sort());
    DisplayTagSuggestions(results);
});

document.addEventListener('click', event => {
   if (!event.target.closest('.search-bar-container')) {
       tagsSearchResultContainer.style.display = 'none';
   }
});

tagSearchElement.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const tag = tagsInput.value.trim();
        if (tag !== "") {
            noteKeeper.AddTag(tag);
            tagsInput.value = "";
        }
    }
});

ShowNotebook(noteKeeper.tags[0].id);


///////////////////////////////////////////////////////////////////////////

function GetTagTypes() {
    return JSON.parse(localStorage.getItem(tagTypeStorageKey));
}

function SaveTagTypes(tagTypes) {
    localStorage.setItem(tagTypeStorageKey, JSON.stringify(tagTypes));
}

function GetTags() {
    return JSON.parse(localStorage.getItem(tagStorageKey));
}

function SaveTags(tagTypes) {
    localStorage.setItem(tagStorageKey, JSON.stringify(tagTypes));
}

function GetDataEntries() {
    return JSON.parse(localStorage.getItem(dataEntryStorageKey));
}

function SaveDataEntries(tagTypes) {
    localStorage.setItem(dataEntryStorageKey, JSON.stringify(tagTypes));
}

function GenerateGuid() {
    let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
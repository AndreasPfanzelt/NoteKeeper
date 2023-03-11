const tagTypeStorageKey = "wbnotes-tagtypes";
const tagStorageKey = "wbnotes-tags";
const dataEntryStorageKey = "wbnotes-dataentries";

const classActive = 'active';

/*
    Html-elements to access.
 */

// Base-Page

// Sidebar
const notebookListElement = document.querySelector('.notebook-list');

// Landing-Page
const landingPageContainer = document.getElementById('landing-page');
const entrySearchInput = document.getElementById('entry-search-input');
const entrySearchResultTable = document.getElementById('entry-table');

// TextEntries
let textEntryElement = {
    container: document.getElementById('text-entry'),
    title: document.getElementById('text-entry-title'),
    text: document.getElementById('text-entry-text'),
    tags: document.querySelector('.tag-list-container'),
    tagsSearchInput: document.getElementById('search-bar-input'),
    tagsSearchResultContainer: document.getElementById('search-results-container'),
};

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
    constructor(id, title, text, tagIds, parentTextEntryId = null) {
        this.id = id;
        this.title = title;
        this.text = text;
        this.tagIds = tagIds;
        this.parentTextEntryId = parentTextEntryId;
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
        const duplicateTags = noteKeeper.tags.filter(tag => tag.title === title);
        if (duplicateTags.length > 0){
            return duplicateTags[0];
        }

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
    Basic handling.
 */

function CreateNotebookElement(notebookEntry) {
    const notebookElement = document.createElement('li');
    notebookElement.textContent = notebookEntry.title;
    // Event listener to select notebook entry.
    notebookElement.addEventListener('click', () => {
        DisplayTextEntry(notebookEntry.id);
        notebookListElement.querySelectorAll('li').forEach((li) => {
            li.classList.remove(classActive);
        });
        notebookElement.classList.add(classActive);
    });

    return notebookElement;
}

function CreateTextEntryTagButton(tag, textEntry) {
    let tagElement = document.createElement('button');
    tagElement.classList.add('tag');
    tagElement.innerHTML = tag.title;
    tagElement.addEventListener('click', () => {
        textEntry.tagIds.splice(textEntry.tagIds.indexOf(tag.id), 1);
        textEntryElement.tags.removeChild(tagElement);
    });

    return tagElement;
}

function AddTagToEntry(tagTitle, entry) {
    const tag = noteKeeper.AddTag(tagTitle);
    entry.tagIds.indexOf(tag.id) === -1 ? entry.tagIds.push(tag.id) : 0;

    DisplayTextEntry(currentTextEntry.id);
}


/*
    Initialization of elements.
 */

function PopulateSidebar() {
    const textEntries = noteKeeper.textEntries.filter(textEntry => textEntry.parentTextEntryId === null);
    textEntries.forEach(textEntry => {
        const entryElement = document.createElement('li');
        entryElement.innerHTML = textEntry.title;
        entryElement.addEventListener('click', () => {
            DisplayTextEntry(textEntry.id);
        });
        notebookListElement.appendChild(entryElement);
    });
}

function InitializeTextEntrySearch() {
    entrySearchInput.addEventListener('input', () => {
        const value = entrySearchInput.value.trim();
        const results = FindSimilarTextEntries(value);
        DisplayEntrySuggestions(results);
    });
}

function InitializeTagSearch(){
    textEntryElement.tagsSearchInput.addEventListener('input', () => {
        const value = textEntryElement.tagsSearchInput.value.trim();
        const results = SearchSimilarStrings(value, noteKeeper.tags.map(tag => tag.title).sort());
        DisplayTagSuggestions(results);
    });

    textEntryElement.tagsSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            AddTagToEntry(textEntryElement.tagsSearchInput.value.trim(), currentTextEntry);
            textEntryElement.tagsSearchInput.value = '';
            textEntryElement.tagsSearchResultContainer.style.display = 'none';
            textEntryElement.tagsSearchInput.blur();

            DisplayTextEntry(currentTextEntry.id);
        }
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('.search-bar-container')) {
            textEntryElement.tagsSearchResultContainer.style.display = 'none';
        }
    });
}

function InitializeDummyData() {

}


/*
    Setting a new view.
 */

function ResetView() {
    const modules = document.querySelectorAll('.module');
    modules.forEach(module => {
        module.classList.add('hidden');
    });
}

function DisplayLandingPage() {
    ResetView();

    landingPageContainer.classList.remove('hidden');
    DisplayEntrySuggestions(noteKeeper.textEntries);
}

function DisplayTextEntry(textEntryId) {
    ResetView();
    textEntryElement.container.classList.remove('hidden');

    const textEntry = noteKeeper.GetTextEntryById(textEntryId);
    currentTextEntry = textEntry;
    textEntryElement.title.innerHTML = textEntry.title;
    textEntryElement.text.innerHTML = textEntry.text;

    const tags = noteKeeper.GetTagsByIds(textEntry.tagIds);
    textEntryElement.tags.innerHTML = '';
    for (let tag of tags) {
        textEntryElement.tags.appendChild(CreateTextEntryTagButton(tag, textEntry));
    }
}


/*
    Update an UI element in current view.
 */

function DisplayEntrySuggestions(textEntries) {
    // Clear any existing rows from the table.
    while (entrySearchResultTable.children[1]) {
        entrySearchResultTable.removeChild(entrySearchResultTable.children[1]);
    }

    textEntries.forEach(textEntry => {
        const row = document.createElement('tr');
        row.addEventListener('click', () => {
            DisplayTextEntry(textEntry.id);
        });

        const titleCell = document.createElement('td');
        titleCell.textContent = textEntry.title;
        row.appendChild(titleCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = 'placeholder';
        row.appendChild(categoryCell);

        const tagsCell = document.createElement('td');
        const tagNames = noteKeeper.GetTagsByIds(textEntry.tagIds).map(tag => tag.title);
        tagsCell.textContent = tagNames.join(', ');
        row.appendChild(tagsCell);

        entrySearchResultTable.appendChild(row);
    });
}

function DisplayTagSuggestions(suggestions) {
    textEntryElement.tagsSearchResultContainer.innerHTML = '';
    if (suggestions.length === 0) {
        textEntryElement.tagsSearchResultContainer.style.display = 'none';
    } else {
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.classList.add('search-result');
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                AddTagToEntry(suggestion, currentTextEntry);
                textEntryElement.tagsSearchInput.value = '';
                textEntryElement.tagsSearchResultContainer.style.display = 'none';
            });
            textEntryElement.tagsSearchResultContainer.appendChild(div);
        });
        textEntryElement.tagsSearchResultContainer.style.display = 'block';
    }
}


/*
    Global helper functions.
 */

function SearchSimilarStrings(value, list) {
    return list.filter(item => {
        return item.toLowerCase().includes(value.toLowerCase());
    });
}

function FindSimilarTextEntries(value) {
    return noteKeeper.textEntries.filter(textEntry => {
        return textEntry.title.toLowerCase().includes(value.toLowerCase());
    })
}

function GenerateGuid() {
    let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


/*
    Here starts the actual script-execution.
 */

const noteKeeper = new NoteKeeper();
InitializeDummyData();
PopulateSidebar();
InitializeTextEntrySearch();
InitializeTagSearch();

DisplayLandingPage();

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
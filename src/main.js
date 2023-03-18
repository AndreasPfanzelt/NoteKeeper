const tagTypeStorageKey = "wbnotes-tagtypes";
const tagStorageKey = "wbnotes-tags";
const dataEntryStorageKey = "wbnotes-dataentries";

const classActive = 'active';

/*
    Settings.
 */
const maxSearchEntries = 25;


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
    const tagDeity = noteKeeper.AddTag('Deity');

    // Deity: Abadar
    const abadarText = `Abadar is the god of cities, law, merchants, and wealth. His followers are usually bankers, merchants, and other people who work with money. He is often depicted as a tall, middle-aged man with a neatly trimmed beard, wearing a robe and holding a key. His holy symbol is a golden key on a field of green or yellow. Abadar's followers believe that wealth and order are closely linked, and that by promoting trade and stability, they can help society as a whole.`;
    const abadarTags = [
        tagDeity,
        noteKeeper.AddTag('City'),
        noteKeeper.AddTag('Law'),
        noteKeeper.AddTag('Merchant'),
        noteKeeper.AddTag('Wealth'),
    ];
    noteKeeper.AddTextEntry('Abadar', abadarText, abadarTags.map(tag => tag.id));

    // Deity: Calistria
    const calistriaText = `Calistria is the goddess of revenge, lust, and trickery. Her followers are usually those who have been wronged, or those who wish to take revenge against someone else. She is often depicted as a beautiful woman with a sharp, cruel smile, wearing revealing clothing and carrying a whip. Her holy symbol is a black widow spider. Calistria's followers believe in the importance of taking revenge, and in using deception and seduction to achieve their goals.`;
    const calistriaTags = [
        tagDeity,
        noteKeeper.AddTag('Revenge'),
        noteKeeper.AddTag('Lust'),
        noteKeeper.AddTag('Trickery'),
    ];
    noteKeeper.AddTextEntry('Calistria', calistriaText, calistriaTags.map(tag => tag.id));

    // Deity: Cayden Cailean
    const caydenCaileanText = `Cayden Cailean is the god of ale, freedom, and bravery. His followers are usually adventurers, travelers, or those who value freedom and independence. He is often depicted as a jovial, bearded man with a mug of ale, wearing a tunic and boots. His holy symbol is a tankard or mug. Cayden Cailean's followers believe in living life to the fullest, enjoying good company and good drink, and standing up for what is right.`;
    const caydenCaileanTags = [
        tagDeity,
        noteKeeper.AddTag('Ale'),
        noteKeeper.AddTag('Freedom'),
        noteKeeper.AddTag('Bravery'),
        noteKeeper.AddTag('Adventure'),
    ];
    noteKeeper.AddTextEntry('Cayden Cailean', caydenCaileanText, caydenCaileanTags.map(tag => tag.id));

    // Deity: Desna
    const desnaText = `Desna is the goddess of dreams, luck, stars, and travelers. Her followers are usually travelers, gamblers, and those who believe in fate and luck. She is often depicted as a beautiful woman with butterfly wings, wearing a long gown and carrying a staff. Her holy symbol is a butterfly or moth. Desna's followers believe in following their dreams, taking risks, and trusting in fate.`;
    const desnaTags = [
        tagDeity,
        noteKeeper.AddTag('Dreams'),
        noteKeeper.AddTag('Luck'),
        noteKeeper.AddTag('Stars'),
        noteKeeper.AddTag('Travelers'),
    ];
    noteKeeper.AddTextEntry('Desna', desnaText, desnaTags.map(tag => tag.id));

    // Deity: Erastil
    const erastilText = `Erastil is the god of farming, hunting, trade, and family. His followers are usually farmers, hunters, tradespeople, and others who work with the land. He is often depicted as an elderly, bearded man wearing simple clothing and carrying a bow or a farming tool. His holy symbol is a bow and arrow or a wheat sheaf. Erastil's followers believe in self-sufficiency, strong family values, and the importance of community. They often live in rural areas and strive to maintain a peaceful, harmonious way of life.`;
    const erastilTags = [
        tagDeity,
        noteKeeper.AddTag('Farming'),
        noteKeeper.AddTag('Hunting'),
        noteKeeper.AddTag('Trade'),
        noteKeeper.AddTag('Family'),
    ];
    noteKeeper.AddTextEntry('Erastil', erastilText, erastilTags.map(tag => tag.id));

    // Deity: Gorum
    const gorumText = `Gorum is the god of battle, weapons, and strength. His followers are usually warriors, soldiers, and other people who rely on physical prowess. He is often depicted as a heavily muscled, scarred man carrying a greatsword or other massive weapon. His holy symbol is a greatsword or a fist. Gorum's followers believe in the importance of combat as a means of testing one's strength and proving one's worth. They often seek out challenges and glory in battle, and have little patience for weakness or cowardice.`;
    const gorumTags = [
        tagDeity,
        noteKeeper.AddTag('Battle'),
        noteKeeper.AddTag('Weapons'),
        noteKeeper.AddTag('Strength'),
    ];
    noteKeeper.AddTextEntry('Gorum', gorumText, gorumTags.map(tag => tag.id));

    // Deity: Iomedae
    const iomedaeText = `Iomedae is the goddess of honor, justice, and valor. Her followers are usually paladins, knights, and other people who dedicate themselves to a noble cause. She is often depicted as a beautiful, armored woman wielding a sword or other weapon. Her holy symbol is a sword with a sunburst hilt. Iomedae's followers believe in upholding the highest ideals of honor and justice, and are willing to fight and die for what they believe in. They often oppose evil and corruption wherever they find it.`;
    const iomedaeTags = [
        tagDeity,
        noteKeeper.AddTag('Honor'),
        noteKeeper.AddTag('Justice'),
        noteKeeper.AddTag('Valor'),
    ];
    noteKeeper.AddTextEntry('Iomedae', iomedaeText, iomedaeTags.map(tag => tag.id));

    // Deity: Pharasma
    const pharasmaText = `Pharasma is the goddess of birth, death, and fate. Her followers are usually midwives, morticians, and other people who deal with the beginning and end of life. She is often depicted as a stern, hooded woman with a staff or ankh. Her holy symbol is an ankh with a curved top. Pharasma's followers believe that every soul has a predetermined destiny, and that it is their duty to guide souls to their proper afterlife. They often maintain strict neutrality, and view both good and evil as necessary components of the cycle of life and death.`;
    const pharasmaTags = [
        tagDeity,
        noteKeeper.AddTag('Birth'),
        noteKeeper.AddTag('Death'),
        noteKeeper.AddTag('Fate'),
    ];
    noteKeeper.AddTextEntry('Pharasma', pharasmaText, pharasmaTags.map(tag => tag.id));

    // Deity: Nethys
    const nethysText = `Nethys is the god of magic and is often depicted as a crazed-looking man with two different colored eyes. His followers include wizards, sorcerers, and other magic users. His holy symbol is a gray skull with one blue and one black eye. Nethys is believed to embody the chaotic and destructive potential of magic, as well as its potential for creation and order.`;
    const nethysTags = [
        tagDeity,
        noteKeeper.AddTag('Magic'),
        noteKeeper.AddTag('Wizard'),
        noteKeeper.AddTag('Sorcerer'),
    ];
    noteKeeper.AddTextEntry('Nethys', nethysText, nethysTags.map(tag => tag.id));

    // Deity: Sarenrae
    const sarenraeText = `Sarenrae is the goddess of redemption, honesty, and the sun. She is often depicted as a beautiful woman with a golden headdress and a sunburst behind her head. Her holy symbol is a sunburst. Her followers include paladins, monks, and anyone seeking redemption. Sarenrae's teachings emphasize compassion and forgiveness, and she is known for her ability to heal and purify.`;
    const sarenraeTags = [
        tagDeity,
        noteKeeper.AddTag('Redemption'),
        noteKeeper.AddTag('Honesty'),
        noteKeeper.AddTag('Sun'),
        noteKeeper.AddTag('Paladin'),
        noteKeeper.AddTag('Monk'),
    ];
    noteKeeper.AddTextEntry('Sarenrae', sarenraeText, sarenraeTags.map(tag => tag.id));

    // Deity: Shelyn
    const shelynText = `Shelyn is the goddess of art, beauty, and love. She is often depicted as a stunningly beautiful woman holding a rose, a dove, or a harp. Her holy symbol is a rose. Her followers include artists, musicians, and lovers. Shelyn's teachings emphasize the beauty of all things and the importance of art and creativity in the world. She is known for her ability to calm and soothe people, and is often called upon to end conflicts through diplomacy and understanding.`;
    const shelynTags = [
        tagDeity,
        noteKeeper.AddTag('Art'),
        noteKeeper.AddTag('Beauty'),
        noteKeeper.AddTag('Love'),
        noteKeeper.AddTag('Music'),
    ];
    noteKeeper.AddTextEntry('Shelyn', shelynText, shelynTags.map(tag => tag.id));

    // Deity: Torag
    const toragText = `Torag is the god of dwarves, protection, and craftsmanship. He is often depicted as a powerfully built dwarf with a long beard, wearing a smith's apron and wielding a hammer or battleaxe. His holy symbol is a hammer or an anvil. His followers include dwarves and anyone seeking protection or the skills of a craftsman. Torag's teachings emphasize the importance of hard work, honor, and defense of one's home and family.`;
    const toragTags = [
        tagDeity,
        noteKeeper.AddTag('Dwarf'),
        noteKeeper.AddTag('Protection'),
        noteKeeper.AddTag('Craftsmanship'),
    ];
    noteKeeper.AddTextEntry('Torag', toragText, toragTags.map(tag => tag.id));

    // Deity: Urgathoa
    const urgathoaText = `Urgathoa is the goddess of gluttony, disease, and undeath. Her followers are often necromancers, alchemists, and those seeking eternal life. She is depicted as a beautiful, yet rotting, woman with sharp teeth and clawed hands. Her holy symbol is a bloated, decayed green heart. Urgathoa's followers believe that death is just another phase of life and that the undead are just as worthy of existence as the living.`;
    const urgathoaTags = [
        tagDeity,
        noteKeeper.AddTag('Gluttony'),
        noteKeeper.AddTag('Disease'),
        noteKeeper.AddTag('Undeath'),
    ];
    noteKeeper.AddTextEntry('Urgathoa', urgathoaText, urgathoaTags.map(tag => tag.id));

    // Deity: Asmodeus
    const asmodeusText = `Asmodeus is the god of tyranny, slavery, and sin. His followers are often cruel overlords, dictators, and those seeking power at any cost. He is depicted as a handsome man with horns, wings, and a devilish tail. His holy symbol is a red pentagram. Asmodeus' followers believe that might makes right and that the strong should rule over the weak.`;
    const asmodeusTags = [
        tagDeity,
        noteKeeper.AddTag('Tyranny'),
        noteKeeper.AddTag('Slavery'),
        noteKeeper.AddTag('Sin'),
    ];
    noteKeeper.AddTextEntry('Asmodeus', asmodeusText, asmodeusTags.map(tag => tag.id));

    // Deity: Lamashtu
    const lamashtuText = `Lamashtu is the goddess of madness, monsters, and nightmares. Her followers are often witches, gnolls, and other monstrous creatures. She is depicted as a terrifying, bestial woman with multiple breasts and the head of a jackal. Her holy symbol is a three-eyed jackal head. Lamashtu's followers believe that chaos and destruction are necessary for growth and evolution, and that they must embrace their monstrous nature in order to achieve their full potential.`;
    const lamashtuTags = [
        tagDeity,
        noteKeeper.AddTag('Madness'),
        noteKeeper.AddTag('Monsters'),
        noteKeeper.AddTag('Nightmares'),
    ];
    noteKeeper.AddTextEntry('Lamashtu', lamashtuText, lamashtuTags.map(tag => tag.id));

    // Deity: Norgorber
    const norgorberText = `Norgorber is the god of greed, secrets, and poison. His followers are often assassins, thieves, and other criminals. He is depicted as a shadowy figure with a skull for a face. His holy symbol is a black mask with silver eyes. Norgorber's followers believe that knowledge is power and that they must use any means necessary to acquire it.`;
    const norgorberTags = [
        tagDeity,
        noteKeeper.AddTag('Greed'),
        noteKeeper.AddTag('Secrets'),
        noteKeeper.AddTag('Poison'),
    ];
    noteKeeper.AddTextEntry('Norgorber', norgorberText, norgorberTags.map(tag => tag.id));

    const tagCountry = noteKeeper.AddTag('Country');

    // Country: Andoran
    const andoranText = `Andoran is a young, idealistic country in the northern part of Avistan. It was founded on the principles of freedom and democracy, and its people value individual rights and the rule of law. Andoran is known for its strong navy, which protects its trade routes and borders, and its Eagle Knights, a military order that serves as the country's protectors and enforcers of law. Its capital is Almas, a bustling city that serves as the heart of Andoran's political and economic life.`;
    const andoranTags = [
        tagCountry,
        noteKeeper.AddTag('Freedom'),
        noteKeeper.AddTag('Democracy'),
        noteKeeper.AddTag('Navy'),
        noteKeeper.AddTag('Eagle Knights'),
    ];
    noteKeeper.AddTextEntry('Andoran', andoranText, andoranTags.map(tag => tag.id));

    // Country: Cheliax
    const cheliaxText = `Cheliax is a powerful and ancient empire in the southwestern part of Avistan. It was once a beacon of civilization and enlightenment, but has since fallen into decadence and tyranny. Its people are divided into two distinct classes: the nobility, who enjoy great wealth and privilege, and the commoners, who are little more than slaves. Cheliax is known for its powerful devil-worshipers, who use dark magic to maintain their grip on power. Its capital is Egorian, a city of dark beauty that reflects the decadence and corruption of the empire.`;
    const cheliaxTags = [
        tagCountry,
        noteKeeper.AddTag('Empire'),
        noteKeeper.AddTag('Decadence'),
        noteKeeper.AddTag('Tyranny'),
        noteKeeper.AddTag('Devil-Worshipers'),
    ];
    noteKeeper.AddTextEntry('Cheliax', cheliaxText, cheliaxTags.map(tag => tag.id));

    // Country: Osirion
    const osirionText = `Osirion is an ancient and mystical land in northeastern Garund. It was once a great civilization, but has since fallen into decline and ruin. Its people are deeply spiritual, and venerate their ancestors and the gods of the desert. Osirion is known for its pyramids, which are said to contain untold treasures and secrets. Its capital is Sothis, a city of wonder and mystery that embodies the magic and mysticism of the land.`;
    const osirionTags = [
        tagCountry,
        noteKeeper.AddTag('Ancient'),
        noteKeeper.AddTag('Mystical'),
        noteKeeper.AddTag('Desert'),
        noteKeeper.AddTag('Pyramids'),
    ];
    noteKeeper.AddTextEntry('Osirion', osirionText, osirionTags.map(tag => tag.id));

    // Country: Taldor
    const taldorText = `Taldor is a fading empire in the southeastern part of Avistan. It was once a great power, but has since lost much of its territory and influence. Its people are proud and traditional, and value their history and culture above all else. Taldor is known for its knights, who uphold the country's chivalric traditions and protect its people from threats both external and internal. Its capital is Oppara, a city of beauty and refinement that embodies the best of Taldan culture.`;
    const taldorTags = [
        tagCountry,
        noteKeeper.AddTag('Empire'),
        noteKeeper.AddTag('Tradition'),
        noteKeeper.AddTag('Knights'),
        noteKeeper.AddTag('Chivalry'),
    ];
    noteKeeper.AddTextEntry('Taldor', taldorText, taldorTags.map(tag => tag.id));

    const tagHistoricFigure = noteKeeper.AddTag('Historic Figure');

    // Character: Ezren
    const ezrenText = `Ezren is a human wizard who spent many years as a merchant before discovering his magical talents. He is often seen wearing a long coat and carrying a staff, and is known for his dry wit and keen intelligence. Ezren is a member of the Pathfinder Society, a group of explorers and adventurers who seek to uncover the secrets of the world. He is also one of the iconic characters of the Pathfinder RPG.`;
    const ezrenTags = [
        tagHistoricFigure,
        noteKeeper.AddTag('Human'),
        noteKeeper.AddTag('Wizard'),
        noteKeeper.AddTag('Pathfinder Society'),
    ];
    noteKeeper.AddTextEntry('Ezren', ezrenText, ezrenTags.map(tag => tag.id));

    // Character: Valeros
    const valerosText = `Valeros is a human fighter and adventurer known for his bravery and love of ale. He is often seen wearing a battered suit of armor and carrying a sword and shield. Valeros is a member of the Pathfinder Society, and is known for his ability to take a beating and keep fighting. He is also one of the iconic characters of the Pathfinder RPG.`;
    const valerosTags = [
        tagHistoricFigure,
        noteKeeper.AddTag('Human'),
        noteKeeper.AddTag('Fighter'),
        noteKeeper.AddTag('Pathfinder Society'),
    ];
    noteKeeper.AddTextEntry('Valeros', valerosText, valerosTags.map(tag => tag.id));

    // Character: Seoni
    const seoniText = `Seoni is a half-elf sorcerer who specializes in elemental magic. She has long red hair and is often seen wearing flowing robes. Seoni is a member of the Pathfinder Society, and is known for her powerful magic and quick thinking. She is also one of the iconic characters of the Pathfinder RPG.`;
    const seoniTags = [
        tagHistoricFigure,
        noteKeeper.AddTag('Half-Elf'),
        noteKeeper.AddTag('Sorcerer'),
        noteKeeper.AddTag('Pathfinder Society'),
    ];
    noteKeeper.AddTextEntry('Seoni', seoniText, seoniTags.map(tag => tag.id));

    // Character: Merisiel
    const merisielText = `Merisiel is an elven rogue and expert in thievery. She is often seen wearing tight leather armor and carrying a pair of short swords. Merisiel is a member of the Pathfinder Society, and is known for her stealth and agility. She is also one of the iconic characters of the Pathfinder RPG.`;
    const merisielTags = [
        tagHistoricFigure,
        noteKeeper.AddTag('Elf'),
        noteKeeper.AddTag('Rogue'),
        noteKeeper.AddTag('Pathfinder Society'),
    ];
    noteKeeper.AddTextEntry('Merisiel', merisielText, merisielTags.map(tag => tag.id));

    const tagOrganization = noteKeeper.AddTag('Organization');

    // Organization: Aspis Consortium
    const aspisText = `The Aspis Consortium is a mercantile organization that operates throughout the Inner Sea region and beyond. The Consortium is known for its ruthlessness, often resorting to dirty tactics to get ahead, and is widely despised by many people. Despite its reputation, the Consortium is highly successful and has many powerful allies. Its agents can be found in almost every major city, and it is rumored to have ties to powerful entities from other planes of existence. The Consortium's symbol is a golden snake coiled around a golden coin.`;
    const aspisTags = [
        tagOrganization,
        noteKeeper.AddTag('Mercantile'),
        noteKeeper.AddTag('Ruthless'),
        noteKeeper.AddTag('Influential'),
        noteKeeper.AddTag('Powerful'),
    ];
    noteKeeper.AddTextEntry('Aspis Consortium', aspisText, aspisTags.map(tag => tag.id));

    // Organization: Pathfinder Society
    const pathfinderText = `The Pathfinder Society is a worldwide organization of adventurers, scholars, and explorers who share a passion for uncovering the world's secrets. The Society sponsors expeditions into uncharted territories, research into ancient relics and lore, and the recovery of lost artifacts. Members of the Society are highly respected, and the organization has many powerful allies. The Society's symbol is a compass rose.`;
    const pathfinderTags = [
        tagOrganization,
        noteKeeper.AddTag('Adventurers'),
        noteKeeper.AddTag('Explorers'),
        noteKeeper.AddTag('Scholars'),
        noteKeeper.AddTag('Respected'),
    ];
    noteKeeper.AddTextEntry('Pathfinder Society', pathfinderText, pathfinderTags.map(tag => tag.id));

    // Organization: Hellknights
    const hellknightsText = `The Hellknights are a highly organized order of knights who dedicate themselves to upholding order and law at any cost. They operate primarily in the nation of Cheliax, but their influence extends far beyond its borders. The Hellknights are feared for their strict adherence to the law, and their brutal methods of enforcing it. Despite their ruthless reputation, the Hellknights are highly respected for their effectiveness, and many people look to them for protection. The Hellknights' symbol is a gauntlet holding a sword.`;
    const hellknightsTags = [
        tagOrganization,
        noteKeeper.AddTag('Knights'),
        noteKeeper.AddTag('Order'),
        noteKeeper.AddTag('Law'),
        noteKeeper.AddTag('Respected'),
    ];
    noteKeeper.AddTextEntry('Hellknights', hellknightsText, hellknightsTags.map(tag => tag.id));

    // Organization: Red Mantis Assassins
    const redMantisText = `The Red Mantis Assassins are a secretive and highly skilled organization of assassins who are feared throughout the Inner Sea region. They are known for their signature red armor and their strict code of conduct. The Assassins only take contracts on specific targets, and they never break their word. Despite their fearsome reputation, the Red Mantis Assassins are highly respected for their professionalism and skill, and many people seek their services. The Red Mantis Assassins' symbol is a stylized praying mantis.`;
    const redMantisTags = [
        tagOrganization,
        noteKeeper.AddTag('Assassins'),
        noteKeeper.AddTag('Secretive'),
        noteKeeper.AddTag('Skilled'),
        noteKeeper.AddTag('Respected'),
    ];
    noteKeeper.AddTextEntry('Red Mantis Assassins', redMantisText, redMantisTags.map(tag => tag.id));

    const tagMonster = noteKeeper.AddTag('Monster');

    // Monster: Beholder
    const beholderText = `Beholders are aberrations with a large, round body and a single, central eye. They have several smaller eyes on stalks that protrude from their body. Beholders are extremely intelligent and have powerful magical abilities. They are also known for their paranoia and aggression, and will attack anything they perceive as a threat.`;
    const beholderTags = [
        tagMonster,
        noteKeeper.AddTag('Aberration'),
        noteKeeper.AddTag('Intelligent'),
        noteKeeper.AddTag('Magical'),
        noteKeeper.AddTag('Aggressive'),
    ];
    noteKeeper.AddTextEntry('Beholder', beholderText, beholderTags.map(tag => tag.id));

    // Monster: Dragon
    const dragonText = `Dragons are legendary creatures with large, scaly bodies and powerful wings. They are known for their intelligence, strength, and magical abilities. Dragons come in a variety of colors, each with its own unique abilities and breath weapon. They are often depicted as hoarders of treasure and are known to be fierce protectors of their lairs.`;
    const dragonTags = [
        tagMonster,
        noteKeeper.AddTag('Dragon'),
        noteKeeper.AddTag('Intelligent'),
        noteKeeper.AddTag('Magical'),
        noteKeeper.AddTag('Protective'),
    ];
    noteKeeper.AddTextEntry('Dragon', dragonText, dragonTags.map(tag => tag.id));

    // Monster: Mind Flayer
    const mindFlayerText = `Mind flayers are humanoid creatures with a distinctive head that resembles an octopus. They are extremely intelligent and possess powerful psychic abilities, including the ability to read minds and control others. Mind flayers are also known for their practice of extracting and consuming the brains of other intelligent creatures, which they use as a source of food and to gain knowledge.`;
    const mindFlayerTags = [
        tagMonster,
        noteKeeper.AddTag('Aberration'),
        noteKeeper.AddTag('Intelligent'),
        noteKeeper.AddTag('Psychic'),
        noteKeeper.AddTag('Cannibalistic'),
    ];
    noteKeeper.AddTextEntry('Mind Flayer', mindFlayerText, mindFlayerTags.map(tag => tag.id));

    // Monster: Tarrasque
    const tarrasqueText = `The tarrasque is a legendary monster known for its immense size and destructive power. It has a massive, armored body with sharp claws and teeth. The tarrasque is said to be nearly invulnerable to all forms of attack, and its mere presence is enough to cause panic and destruction. Many legends suggest that the only way to defeat a tarrasque is to use powerful magic or divine intervention.`;
    const tarrasqueTags = [
        tagMonster,
        noteKeeper.AddTag('Legendary'),
        noteKeeper.AddTag('Destructive'),
        noteKeeper.AddTag('Invulnerable'),
        noteKeeper.AddTag('Mythical'),
    ];
    noteKeeper.AddTextEntry('Tarrasque', tarrasqueText, tarrasqueTags.map(tag => tag.id));
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
    //textEntryElement.text.innerHTML = textEntry.text;
    quillEditor.setContents(quillEditor.clipboard.convert(textEntry.text));

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

    textEntries.sort((a, b) => {
        if (a.title < b.title) {
            return -1;
        }
        if (a.title > b.title) {
            return 1;
        }
        return 0;
    });

    let counter = 0;
    textEntries.forEach(textEntry => {
        if (++counter > maxSearchEntries) {
            return;
        }
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
        suggestions.sort();

        let counter = 0;
        suggestions.forEach(suggestion => {
            if (++counter > maxSearchEntries) {
                return;
            }
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

function FindSimilarTags(value) {
    return noteKeeper.tags.filter(tag => {
        return tag.title.toLowerCase().includes(value.toLowerCase());
    });
}

function FindSimilarTextEntries(value) {
    let viableTextEntries = noteKeeper.textEntries.filter(textEntry => {
        return textEntry.title.toLowerCase().includes(value.toLowerCase());
    });

    const foundTextEntryIds = new Set(viableTextEntries.map(entry => entry.id));
    const viableTags = FindSimilarTags(value);
    if (viableTags) {
        const textEntriesByTags = noteKeeper.textEntries.filter(textEntry => {
            for (const tag of viableTags) {
                if (textEntry.tagIds.includes(tag.id)){
                    return !foundTextEntryIds.has(textEntry.id);
                }
            }

            return false;
        });

        viableTextEntries = viableTextEntries.concat(textEntriesByTags);
    }

    return viableTextEntries;
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

var options = {
    debug: 'info',
    placeholder: 'Compose an epic ...',
    theme: 'snow'
}
var quillEditor = new Quill('#editor', options);

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
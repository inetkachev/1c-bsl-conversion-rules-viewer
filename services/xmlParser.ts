import type { ParsedData, Property, Rule, RuleGroup } from '../types';

const nodeValue = (node: Element | null, query: string): string => {
    return node?.querySelector(query)?.textContent?.trim() || '';
};

const getProperties = (element: Element | null): Property[] => {
    if (!element) return [];
    const props: Property[] = [];
    element.querySelectorAll(':scope > Свойство, :scope > Группа').forEach(propNode => {
        const isGroup = propNode.tagName === 'Группа';

        const sourceNode = propNode.querySelector('Источник');
        const receiverNode = propNode.querySelector('Приемник');

        props.push({
            name: nodeValue(propNode, 'Наименование'),
            source: sourceNode?.textContent?.trim() || sourceNode?.getAttribute('Имя') || '',
            sourceType: sourceNode?.getAttribute('Вид') || null,
            receiver: receiverNode?.textContent?.trim() || receiverNode?.getAttribute('Имя') || '',
            receiverType: receiverNode?.getAttribute('Вид') || null,
            conversionRuleCode: nodeValue(propNode, 'КодПравилаКонвертации'),
            code: nodeValue(propNode, 'Код'),
            isSearch: propNode.getAttribute('Поиск') === 'true',
            getFromIncomingData: propNode.querySelector('ПолучитьИзВходящихДанных')?.textContent?.trim() === 'true',
            properties: isGroup ? getProperties(propNode) : [],
            handler: nodeValue(propNode, 'ПередВыгрузкой') || nodeValue(propNode, 'ПриВыгрузке') || null
        });
    });
    return props;
};

const pkoRuleParser = (el: Element): Rule => ({
    type: 'ПКО',
    id: nodeValue(el, 'Код'),
    name: nodeValue(el, 'Наименование'),
    rawXml: el.outerHTML,
    source: nodeValue(el, 'Источник'),
    receiver: nodeValue(el, 'Приемник'),
    afterLoad: nodeValue(el, 'ПослеЗагрузки'),
    onLoad: nodeValue(el, 'ПриЗагрузке'),
    beforeConvert: nodeValue(el, 'ПередКонвертациейОбъекта'),
    afterLoadParams: nodeValue(el, 'ПослеЗагрузкиПараметров'),
    properties: getProperties(el.querySelector('Свойства'))
});

const parsePkoGroups = (element: Element): RuleGroup[] => {
    const groups: RuleGroup[] = [];
    element.childNodes.forEach(node => {
        if (node.nodeType === 1 && (node as Element).tagName === 'Группа') {
            const groupEl = node as Element;
            const group: RuleGroup = {
                name: nodeValue(groupEl, ':scope > Наименование'),
                rules: Array.from(groupEl.querySelectorAll(':scope > Правило')).map(pkoRuleParser),
                subGroups: parsePkoGroups(groupEl),
            };
            if ((group.rules && group.rules.length > 0) || (group.subGroups && group.subGroups.length > 0)) {
                groups.push(group);
            }
        }
    });
    return groups;
};

export const parseXML = (xmlString: string): ParsedData | null => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        const root = xmlDoc.querySelector('ПравилаОбмена');

        if (!root) return null;

        const pko: RuleGroup[] = [];
        const pkoContainer = root.querySelector('ПравилаКонвертацииОбъектов');

        if (pkoContainer) {
            const rootRules = Array.from(pkoContainer.querySelectorAll(':scope > Правило')).map(pkoRuleParser);
            const nestedGroups = parsePkoGroups(pkoContainer);
            pko.push(...nestedGroups);
            
            if (rootRules.length > 0) {
                 pko.unshift({ name: 'Без группы', rules: rootRules });
            }
        }
        
        const pvd: Rule[] = Array.from(root.querySelectorAll('ПравилаВыгрузкиДанных Правило')).map(el => ({
            type: 'ПВД',
            id: nodeValue(el, 'Код'),
            name: nodeValue(el, 'Наименование'),
            rawXml: el.outerHTML,
            conversionRuleCode: nodeValue(el, 'КодПравилаКонвертации'),
            dataSelectionMethod: nodeValue(el, 'СпособОтбораДанных'),
            beforeRuleProcessing: nodeValue(el, 'ПередОбработкойПравила') || nodeValue(el, 'ПередВыгрузкойОбъекта'),
        }));
        
        const algorithms: Rule[] = Array.from(root.querySelectorAll('Алгоритмы Алгоритм')).map(el => ({
            type: 'Алгоритм',
            id: el.getAttribute('Имя') || 'unknown',
            name: el.getAttribute('Имя') || 'Unknown Algorithm',
            rawXml: el.outerHTML,
            code: el.querySelector('Текст')?.textContent?.trim() || ''
        }));
        
        const parameters: Rule[] = Array.from(root.querySelectorAll('Параметры Параметр')).map(el => ({
            type: 'Параметр',
            id: el.getAttribute('Имя')?.trim() || 'unknown',
            name: el.getAttribute('Наименование') || 'Unknown Parameter',
            rawXml: el.outerHTML,
            source: el.getAttribute('ТипЗначения') || ''
        }));
        
        const requests: Rule[] = Array.from(root.querySelectorAll('Запросы Запрос')).map(el => ({
            type: 'Запрос',
            id: el.getAttribute('Имя') || 'unknown',
            name: el.getAttribute('Имя') || 'Unknown Request',
            rawXml: el.outerHTML,
            code: el.querySelector('Текст')?.textContent?.trim() || ''
        }));


        return {
            name: nodeValue(root, 'Наименование'),
            sourceConfig: root.querySelector('Источник')?.getAttribute('СинонимКонфигурации') || '',
            receiverConfig: root.querySelector('Приемник')?.getAttribute('СинонимКонфигурации') || '',
            beforeExport: nodeValue(root, 'ПередВыгрузкойДанных'),
            afterLoad: nodeValue(root, 'ПослеЗагрузкиДанных'),
            pko,
            pvd,
            algorithms,
            parameters,
            requests
        };

    } catch (error) {
        console.error("Failed to parse XML:", error);
        return null;
    }
};
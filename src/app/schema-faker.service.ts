import { Injectable } from '@angular/core';
import * as stringSimilarity from 'string-similarity';
import { faker } from '@faker-js/faker';

@Injectable({ providedIn: 'root' })
export class SchemaFakerService {

    fakerMethods: string[] = [
        'finance.pin', 'finance.routingNumber', 'finance.transactionDescription', 'finance.transactionType',
        'lorem.lines', 'lorem.paragraph', 'lorem.paragraphs', 'lorem.sentence', 'lorem.sentences', 'lorem.slug', 'lorem.text', 'lorem.word', 'lorem.words',
        'music.album', 'music.artist', 'music.genre', 'music.songName',
        'number.bigInt', 'number.binary', 'number.float', 'number.hex', 'number.int', 'number.octal', 'number.romanNumeral',
        'food.dish', 'food.ethnicCategory', 'food.fruit', 'food.ingredient', 'food.meat', 'food.spice', 'food.vegetable',
        'git.branch', 'git.commitDate', 'git.commitEntry', 'git.commitMessage', 'git.commitSha',
        'airline.aircraftType', 'airline.airline', 'airline.airplane', 'airline.airport', 'airline.flightNumber', 'airline.recordLocator', 'airline.seat',
        'person.bio', 'person.firstName', 'person.fullName', 'person.gender', 'person.jobArea', 'person.jobDescriptor', 'person.jobTitle', 'person.jobType', 'person.lastName', 'person.middleName', 'person.prefix', 'person.sex', 'person.sexType', 'person.suffix', 'person.zodiacSign',
        'animal.bear', 'animal.bird', 'animal.cat', 'animal.cetacean', 'animal.cow', 'animal.crocodilia', 'animal.dog', 'animal.fish', 'animal.horse', 'animal.insect', 'animal.lion', 'animal.petName', 'animal.rabbit', 'animal.rodent', 'animal.snake', 'animal.type',
        'hacker.abbreviation', 'hacker.adjective', 'hacker.ingverb', 'hacker.noun', 'hacker.phrase', 'hacker.verb',
        'phone.imei', 'phone.number',
        'book.author', 'book.format', 'book.genre', 'book.publisher', 'book.series', 'book.title',
        'science.chemicalElement', 'science.unit',
        'string.alpha', 'string.alphanumeric', 'string.binary', 'string.fromCharacters', 'string.hexadecimal', 'string.nanoid', 'string.numeric', 'string.octal', 'string.sample', 'string.symbol', 'string.ulid', 'string.uuid',
        'color.cmyk', 'color.colorByCSSColorSpace', 'color.cssSupportedFunction', 'color.cssSupportedSpace', 'color.hsl', 'color.human', 'color.hwb', 'color.lab', 'color.lch', 'color.rgb', 'color.space',
        'commerce.department', 'commerce.isbn', 'commerce.price', 'commerce.product', 'commerce.productAdjective', 'commerce.productDescription', 'commerce.productMaterial', 'commerce.productName',
        'image.avatar', 'image.avatarGitHub', 'image.dataUri', 'image.personPortrait', 'image.url', 'image.urlLoremFlickr', 'image.urlPicsumPhotos',
        'system.commonFileExt', 'system.commonFileName', 'system.commonFileType', 'system.cron', 'system.directoryPath', 'system.fileExt', 'system.fileName', 'system.filePath', 'system.fileType', 'system.mimeType', 'system.networkInterface', 'system.semver',
        'company.buzzAdjective', 'company.buzzNoun', 'company.buzzPhrase', 'company.buzzVerb', 'company.catchPhrase', 'company.catchPhraseAdjective', 'company.catchPhraseDescriptor', 'company.catchPhraseNoun', 'company.name',
        'internet.displayName', 'internet.domainName', 'internet.domainSuffix', 'internet.domainWord', 'internet.email', 'internet.emoji', 'internet.exampleEmail', 'internet.httpMethod', 'internet.httpStatusCode', 'internet.ip', 'internet.ipv4', 'internet.ipv6', 'internet.jwt', 'internet.jwtAlgorithm', 'internet.mac', 'internet.password', 'internet.port', 'internet.protocol', 'internet.url', 'internet.userAgent', 'internet.username',
        'vehicle.bicycle', 'vehicle.color', 'vehicle.fuel', 'vehicle.manufacturer', 'vehicle.model', 'vehicle.type', 'vehicle.vehicle', 'vehicle.vin', 'vehicle.vrm',
        'word.adjective', 'word.adverb', 'word.conjunction', 'word.interjection', 'word.noun', 'word.preposition', 'word.sample', 'word.verb', 'word.words'
    ];

    constructor() { }

    findBestFakerMethod(fieldName: string, fieldType: string, description?: string): string {
        console.log(fieldName)
        console.log(fieldType)
        console.log(description)
        const query = `${fieldName}`.toLowerCase();
        const bestMatch = stringSimilarity.findBestMatch(query, this.fakerMethods);
        console.log(bestMatch)
        return bestMatch.bestMatch.target;
    }

    callFakerMethod(path: string): any {
        try {
            const parts = path.split(".");
            let current: any = faker;
            for (const part of parts) {
                current = current[part];
                if (typeof current !== 'function' && typeof current !== 'object') break;
            }
            return typeof current === 'function' ? current() : current;
        } catch {
            return '<invalid faker method>';
        }
    }

    resolveRef(ref: string, rootSchema: any): any {
        try {
            const path = ref.replace(/^#\//, '').split('/');
            return path.reduce((acc: any, key: string) => acc && acc[key], rootSchema);
        } catch {
            return { $ref: ref }; // fallback
        }
    }

    generateExampleFromSchema(schema: any, rootSchema: any = schema): any {
        if (typeof schema === 'string') {
            try {
                schema = JSON.parse(schema);
            } catch (err) {
                console.error('Invalid JSON schema string:', err);
                return {};
            }
        }

        if (schema.allOf && Array.isArray(schema.allOf)) {
            schema = schema.allOf.reduce((merged: any, part: any) => {
                if (part.$ref) {
                    part = this.resolveRef(part.$ref, rootSchema);
                }
                return {
                    ...merged,
                    ...part,
                    properties: {
                        ...(merged.properties || {}),
                        ...(part?.properties || {})
                    }
                };
            }, { type: 'object', properties: {} });
        }

        if (schema.anyOf || schema.oneOf) {
            const options = schema.anyOf || schema.oneOf;
            return this.generateExampleFromSchema(options[0], rootSchema);
        }

        if (schema.if && schema.then) {
            return this.generateExampleFromSchema(schema.then, rootSchema);
        }

        const result: any = {};

        if (schema.type === 'object' && schema.properties) {
            for (const [key, value] of Object.entries<any>(schema.properties)) {
                if (!value) {
                    result[key] = '<missing schema>';
                    continue;
                }

                let val = value;
                console.log(val)
                console.log(val.type)
                console.log(val.const)

                if (val.$ref) {
                    result[key] = { $ref: val.$ref };
                    continue;
                }

                if ('const' in val) {
                    result[key] = val.const;
                    continue;
                }

                if (val.enum) {
                    result[key] = val.enum[0];
                    continue;
                }

                switch (val.type) {
                    case 'string':
                        const method = this.findBestFakerMethod(key, val.type, val.description);
                        result[key] = this.callFakerMethod(method);
                        break;
                    case 'array':
                        const item = val.items?.$ref ? this.resolveRef(val.items.$ref, rootSchema) : val.items;
                        result[key] = [1, 2, 3].map(() => this.generateExampleFromSchema(item, rootSchema));
                        break;
                    case 'object':
                        result[key] = this.generateExampleFromSchema(val, rootSchema);
                        break;
                    case 'boolean':
                        result[key] = faker.datatype.boolean();
                        break;
                    case 'number':
                        result[key] = faker.number.float({ min: 1, max: 1000 });
                        break;
                    case 'integer':
                        result[key] = faker.number.int({ min: 1, max: 100 });
                        break;
                    default:
                        result[key] = '<unknown type>';
                }
            }
        }

        return result;
    }
}

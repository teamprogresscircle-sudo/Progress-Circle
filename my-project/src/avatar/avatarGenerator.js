import { createAvatar } from '@dicebear/core';
import { openPeeps } from '@dicebear/collection';

export function generateAvatarSvg(config) {
    const options = {
        seed: config.seed ? String(config.seed) : 'default',
        radius: 50,
    };

    if (config.backgroundColor && typeof config.backgroundColor === 'string' && config.backgroundColor !== 'transparent') {
        options.backgroundColor = [config.backgroundColor.replace('#', '')];
    }

    if (config.head && typeof config.head === 'string') options.head = [config.head];
    if (config.face && typeof config.face === 'string') options.face = [config.face];

    if (config.facialHair && typeof config.facialHair === 'string' && config.facialHair !== '') {
        options.facialHair = [config.facialHair];
        options.facialHairProbability = 100;
    } else {
        options.facialHairProbability = 0;
    }

    if (config.accessories && typeof config.accessories === 'string' && config.accessories !== '') {
        options.accessories = [config.accessories];
        options.accessoriesProbability = 100;
    } else {
        options.accessoriesProbability = 0;
    }

    if (config.clothingColor && typeof config.clothingColor === 'string') options.clothingColor = [config.clothingColor.replace('#', '')];
    if (config.skinColor && typeof config.skinColor === 'string') options.skinColor = [config.skinColor.replace('#', '')];
    if (config.headContrastColor && typeof config.headContrastColor === 'string') options.headContrastColor = [config.headContrastColor.replace('#', '')];

    const avatar = createAvatar(openPeeps, options);
    let svg = avatar.toString();

    // FORCE COLOR HACK (Surgical V21):
    // Conservative approach: only recolor non-black hair and hat shapes.
    // This protects facial outlines and features which are often merged with black hair.
    if (config.headContrastColor && typeof config.headContrastColor === 'string') {
        const targetColor = config.headContrastColor.startsWith('#') ? config.headContrastColor : `#${config.headContrastColor}`;

        const headMatch = svg.match(/<g transform="(?:matrix|translate)[^>]+>/);
        const faceMatch = svg.match(/<g transform="translate\(315 248\)"[^>]*>/);
        const accMatch = svg.match(/<g transform="translate\(203 303\)"[^>]*>/);

        if (headMatch && faceMatch && faceMatch.index > headMatch.index) {
            const headIdx = headMatch.index;
            const faceIdx = faceMatch.index;
            const accIdx = accMatch ? accMatch.index : svg.length;

            let beforeHead = svg.substring(0, headIdx);
            let headArea = svg.substring(headIdx, faceIdx);
            let faceArea = svg.substring(faceIdx, accIdx);
            const afterAcc = svg.substring(accIdx);

            const targets = ['#9ddadb', '#c93305', '#ae5d29', '#000', '#000000'];

            // Recolor Head Area
            targets.forEach(t => {
                const re = new RegExp(`fill="${t}"`, 'g');
                headArea = headArea.replace(re, `fill="${targetColor}"`);
            });

            // Recolor Facial Hair Area (inside faceArea group, after the face features)
            // The face features themselves are also #000, so we must be CAREFUL.
            // However, faceArea starts with the face group <g transform="translate(315 248)">.
            // Facial hair groups like <g transform="translate(279 400)"> come AFTER the face group in our range.

            // Optimization: Only recolor black in the facial hair groups found within faceArea
            const hairGroupRegex = /<g transform="translate\((?:279 400|179 343|203 303)\)"[^>]*>[\s\S]*?<\/g>/g;
            // Wait, 203 303 is accessories. We should exclude it from the hairGroupRegex if we use faceArea.
            // Actually, faceArea is faceIdx to accIdx. accIdx IS the 203 303 group.
            // So faceArea contains the Face group + Facial Hair groups.

            // We only want to target the facial hair groups WITHIN faceArea.
            const facialHairTargets = ['translate(279 400)', 'translate(179 343)'];
            facialHairTargets.forEach(transform => {
                const startToken = `<g transform="${transform}"`;
                const startPos = faceArea.indexOf(startToken);
                if (startPos !== -1) {
                    const endPos = faceArea.indexOf('</g>', startPos) + 4;
                    let group = faceArea.substring(startPos, endPos);
                    targets.forEach(t => {
                        const re = new RegExp(`fill="${t}"`, 'g');
                        group = group.replace(re, `fill="${targetColor}"`);
                    });
                    faceArea = faceArea.substring(0, startPos) + group + faceArea.substring(endPos);
                }
            });

            svg = beforeHead + headArea + faceArea + afterAcc;
        }
    }

    return svg;
}

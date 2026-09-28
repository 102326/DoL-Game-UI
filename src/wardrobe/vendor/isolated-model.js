/* Derived from Degrees of Lewdity, commit 41993d3f32476f0b1c8db730c159a50ffcdc2a65.
 * CC BY-NC-SA 4.0; see UPSTREAM-RENDERER-LICENSE. Generated; do not edit.
 * All stateful free variables below belong to the caller's private snapshot.
 */
export function createIsolatedModel(context) {
const {V,T,setup,Skin,Weather,Time,Transformations,ZIndices,ColourUtils,C,clone}=context;
const window={},Browser={isGecko:false},Errors={report(message){throw Error(message)}};
const Renderer={...context.renderer,CanvasModels:{},CanvasModelCaches:{},ImageCaches:{}};
const macros={};const DefineMacro=(name,fn)=>macros[name]=fn;
const jQuery={extend:Object.assign};
const between=(n,min,max)=>n>=min&&n<=max;
const toTitleCase=s=>s.replace(/\b\w/g,c=>c.toUpperCase());
const random=(min,max)=>max===undefined?0:min;
const painToTearsLvl=pain=>Math.floor(Math.min(99,Math.max(0,pain||V.pain))/20);
function clothesIndex(slot,item){const items=setup.clothes[slot];const index=context.clothesIndex?context.clothesIndex(slot,item):items.findIndex(c=>c.variable===item.variable&&c.modder===item.modder);if(index<0)throw Error('Unknown clothing descriptor: '+slot);return index}
function clothingData(slot,item,key){return setup.clothes[slot][clothesIndex(slot,item)][key]}
const tinycolor=rgb=>({toHexString:()=>'#'+[rgb.r,rgb.g,rgb.b].map(n=>Math.round(Math.min(255,Math.max(0,n))).toString(16).padStart(2,'0')).join('')});
function playerChastity(slots, inAllSlots = false) {
	let chastity = false;
	const chastityCovered = [];
	if (!slots && V.worn.genitals.type.includes("chastity")) {
		// Used for general cases of chastity
		chastity = true;
	}
	if (typeof slots === "string" || slots instanceof String || Array.isArray(slots)) {
		// Genital Strings
		if (slots.includes("penis") && V.player.penisExist && V.worn.genitals.type.includesAny("cage", "hidden")) {
			chastity = true;
			if (!chastityCovered.includes("penis")) chastityCovered.push("penis");
		}
		if (slots.includes("vagina") && V.player.vaginaExist && V.worn.genitals.type.includes("hidden")) {
			chastity = true;
			if (!chastityCovered.includes("vagina")) chastityCovered.push("vagina");
		}
		if (slots.includes("anus") && V.worn.genitals.type.includes("chastity") && V.worn.genitals.anal_shield === 1) {
			chastity = true;
			if (!chastityCovered.includes("anus")) chastityCovered.push("anus");
		}

		// Type Strings
		if (slots.includes("hidden") && V.worn.genitals.type.includes("hidden")) {
			chastity = true;
			if (!chastityCovered.includes("penis")) chastityCovered.push("penis");
			if (!chastityCovered.includes("vagina")) chastityCovered.push("vagina");
		}
		if (slots.includes("cage") && V.worn.genitals.type.includes("cage")) {
			chastity = true;
			if (!chastityCovered.includes("penis")) chastityCovered.push("penis");
		}
	}
	if (inAllSlots && Array.isArray(slots) && ["penis", "vagina", "anus"].includes(slots)) {
		const slotsToInclude = slots.filter(e => ["penis", "vagina", "anus"].includes(e));
		if (slotsToInclude.count < chastityCovered.length) {
			return false;
		}
	}
	return chastity;
}
function getClothingOptionsItem(slot, item, stage) {
	const itemOptions = {};

	const index = clothesIndex(slot, item);
	itemOptions[slot] = {
		index,
		setup: setup.clothes[slot][index],
		integrity: integrityKeyword(item, slot),
		colour: item.colour,
		alt: item.altposition,
		pattern: item.pattern,
		pattern_layer: item.pattern_layer,
	};
	itemOptions[slot].alpha = { 1: 0.9, 2: 0.7, 3: 0.5 }[stage] ?? 1.0;
	itemOptions[slot].accColour = item.accessory_colour;
	return itemOptions;
}
function getClothingOptions() {
	const modelOptions = { worn: {}, filters: {} };
	const slots = [
		["upper", V.upperwetstage],
		["over_upper"],
		["genitals"],
		["lower", V.lowerwetstage],
		["over_lower"],
		["under_lower", V.underlowerwetstage],
		["under_upper", V.underupperwetstage],
		["hands"],
		["handheld"],
		["head"],
		["over_head"],
		["face"],
		["neck"],
		["legs"],
		["feet"],
	];

	for (const slotobj of slots) {
		const item = V.worn[slotobj[0]];
		modelOptions.worn = { ...modelOptions.worn, ...getClothingOptionsItem(slotobj[0], item, slotobj[1]) };

		if (item.accessory_layer_under) {
			modelOptions.acc_layer_under = item.accessory_layer_under;
		}
		if (item.colour === "custom") {
			/* TODO @aimozg We recalculate custom colour RGB here; in future versions, we should store custom colours in canvasfilter-friendly way */
			modelOptions.filters["worn_" + slotobj[0] + "_custom"] = item.colourCanvasFilter || getCustomClothesColourCanvasFilter(item.colourCustom);
		}
		if (item.accessory_colour === "custom") {
			modelOptions.filters["worn_" + slotobj[0] + "_acc_custom"] =
				item.accessory_colourCanvasFilter || getCustomClothesColourCanvasFilter(item.accessory_colourCustom);
		}
	}
	return modelOptions;
}
function integrityKeyword(worn, slot) {
	const i = worn.integrity / clothingData(slot, worn, "integrity_max");
	if (i <= 0.2) {
		return "tattered";
	} else if (i <= 0.5) {
		return "torn";
	} else if (i <= 0.9) {
		return "frayed";
	} else {
		return "full";
	}
}
function playerBellySize(pregnancyOnly = false) {
	let bellySize = V.bellySizeDebug || 0;
	const vpregnancy = V.sexStats.vagina.pregnancy;
	const apregnancy = V.sexStats.anus.pregnancy;
	if (!V.statFreeze && (vpregnancy.fetus.length || apregnancy.fetus.length)) {
		let pregnancyProgress = 0;
		if (vpregnancy.timerEnd) pregnancyProgress = Math.clamp(vpregnancy.timer / vpregnancy.timerEnd, 0, 1);
		if (apregnancy.timerEnd) pregnancyProgress = Math.clamp(apregnancy.timer / apregnancy.timerEnd, 0, 1);
		let maxSize = 0;
		switch (vpregnancy.type) {
			case "parasite":
				if (!pregnancyOnly) bellySize += Math.clamp(vpregnancy.fetus.length, 0, 4);
				break;
			case "human":
				if (!vpregnancy.gaveBirth) maxSize += 21 + Math.clamp(vpregnancy.fetus.length, 1, 3);
				break;
			// For human offspring, max sizes are 22 for single fetus, 23 for twins, and 24 for triplets.
			case "wolf":
				if (!vpregnancy.gaveBirth) maxSize += 20 + Math.clamp(vpregnancy.fetus.length / 2, 1, 4);
				break;
			case "hawk":
				if (!vpregnancy.gaveBirth) maxSize += 17 + Math.clamp(vpregnancy.fetus.length, 1, 4);
				break;
		}
		switch (apregnancy.type) {
			case "parasite":
				if (!pregnancyOnly) bellySize += Math.clamp(apregnancy.fetus.length, 0, 4);
				break;
			case "human":
				if (!apregnancy.gaveBirth) maxSize += 21 + Math.clamp(apregnancy.fetus.length, 1, 3);
				break;
			case "wolf":
				if (!apregnancy.gaveBirth) maxSize += 20 + Math.clamp(apregnancy.fetus.length / 2, 1, 4);
				break;
			case "hawk":
				if (!apregnancy.gaveBirth) maxSize += 17 + Math.clamp(apregnancy.fetus.length, 1, 4);
				break;
		}
		// The '+ 5' inflates the pregnancy belly size, meaning that the early stages of pregnancy will have no belly size increase due to it being reduced by the '- 5'
		bellySize += Math.clamp(pregnancyProgress * Math.clamp(maxSize + 5, 0, 24 + 5) - 5, 0, 24);
	}
	if (!V.statFreeze && !pregnancyOnly) {
		if (V.daily.bloated) bellySize += Math.clamp(V.daily.bloated, 1, 2);
		if (V.parasite.tummy.name === "urchin") bellySize += 2;
		if (V.parasite.tummy.name === "slime") bellySize -= 2;
	}

	return Math.floor(Math.clamp(bellySize, 0, 24));
}
function playerHasStrapon() {
	return V.worn.under_lower.type.includes("strap-on") && V.worn.under_lower.state === "waist";
}
function playerHasButtPlug() {
	return V.worn.butt_plug != null && V.worn.butt_plug.state === "worn" && V.worn.butt_plug.worn;
	// V.worn.butt_plug.worn is just as a safeguard for now
}
function calculatePenisBulge() {
	if (V.worn.under_lower.type.includes("strap-on")) return (V.worn.under_lower.size || 0) * 3;
	const compressed = V.player.penisExist && V.worn.genitals.type.includes("hidden");
	if (!V.player.penisExist || compressed) return 0;

	if (V.worn.genitals.type.includes("cage")) {
		return Math.clamp(V.player.penissize, 0, Infinity);
	}
	// Mentioned in combat about npcs `trying to force an erection`, when below the specific arousal checks
	if ((V.arousal > 9000 && V.player.penissize === 1) || (V.arousal > 9500 && V.player.penissize === 0)) return 1;

	let erectionState = 1;
	if (V.arousal >= 8000) {
		erectionState = 3;
	} else if (V.arousal >= 6000) {
		erectionState = 2;
	}
	return Math.clamp((V.player.penissize - 1) * erectionState, 0, Infinity);
}
function apparentbreastsizecheck() {
	T.tempbreast = V.player.breastsize;
	if (clothingData("upper", V.worn.upper, "bustresize") != null) {
		T.tempbreast += clothingData("upper", V.worn.upper, "bustresize");
	}
	if (clothingData("under_upper", V.worn.under_upper, "bustresize") != null) {
		T.tempbreast += clothingData("under_upper", V.worn.under_upper, "bustresize");
	}
	if (clothingData("over_upper", V.worn.over_upper, "bustresize") != null) {
		T.tempbreast += clothingData("over_upper", V.worn.over_upper, "bustresize");
	}
	// using the default values of $breastsizemin and $breastsizemax, to avoid issues with the values changing during the game
	V.player.perceived_breastsize = Math.clamp(T.tempbreast, 0, setup.breastsizes.length - 1);
}
function hairLengthStringToNumber(hairLength) {
	return {
		short: 0,
		shoulder: 200,
		chest: 400,
		navel: 600,
		thighs: 700,
		feet: 900,
	}[hairLength];
}
function removeDiacritics(text) {
	return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}
function normaliseFileName(text) {
	return removeDiacritics(text)
		.replace(/([A-Z])/g, "-$1")
		.replace(/[\s-_]+/g, "-")
		.toLowerCase();
}
/* eslint-disable jsdoc/no-undefined-types */
/*
 * On caching.
 *
 * I. We want to cache loaded images.
 * For that, there is Renderer.ImageCaches, "url"-><img> mapping
 *
 * II. We want to cache processed images.
 * For that, there is cachedImage and cachedProcessing in the CompositeLayer.
 * cachedProcessing is JSON string of all processing options.
 * We don't use some global "url + processing" cache because of bloat risk.
 * CanvasModel layers are not recreated on render, so rendering same model instance twice uses caching.
 *
 * III. We want to cache identical keyframes of animation, composed of multiple layers.
 * That's done in the animation code.
 *
 * IV. We want caches to persist between passages (if possible).
 * To do that we reuse same CanvasModel between passages.
 *
 * V. We still need to have separate instances of same model and don't want their caches to intersect.
 * For that, CanvasModels are cached by "slot" optional parameter.
 *
 * =======
 * Example
 * =======
 *
 * In the sidebar <<img>> widget, "main" CanvasModel is rendered using "sidebar" cache slot.
 * Whenever it is requested, it is same CanvasModel instance, so image processing is done only for changing layers.
 *
 * If in some test passage we render 10 more "main" CanvasModels without cache slot, they hold no cached layers and
 * are re-composed. (Source images are still cached globally under their url)
 */

class CanvasModel {
	/**
	 * Static factory method to create/fetch a stored model.
	 *
	 * @param {string} id
	 * @param {string} slot
	 * @returns {CanvasModel}
	 */
	static create(id, slot) {
		const template = Renderer.CanvasModels[id];
		if (!template) {
			Errors.report("Requested non-existing model " + id);
			return new CanvasModel({
				name: "empty",
				width: 1,
				height: 1,
				layers: {},
				frames: 1,
				defaultOptions() {
					console.debug("CanvasModel-defaultOptions not set.");
				},
				generatedOptions() {
					return [];
				},
				preprocess(options) {
					console.debug("CanvasModel-preprocess not set.");
				},
			});
		}
		if (!slot) {
			return new CanvasModel(template);
		}
		let cache = Renderer.CanvasModelCaches[id];
		if (!cache) {
			cache = {};
			Renderer.CanvasModelCaches[id] = cache;
		}
		let model = cache[slot];
		if (model) {
			return model;
		}
		model = new CanvasModel(template);
		cache[slot] = model;
		return model;
	}

	/**
	 * @param {CanvasModelOptions} options
	 */
	constructor(options) {
		this.name = options.name;
		this.width = options.width;
		this.height = options.height;
		this.frames = options.frames || 1;
		this.metadata = options.metadata || {};
		this.scale = options.scale || false;
		if ("generatedOptions" in options) this.generatedOptions = options.generatedOptions;
		if ("defaultOptions" in options) this.defaultOptions = options.defaultOptions;
		if ("preprocess" in options) this.preprocess = options.preprocess;
		if ("postprocess" in options) this.postprocess = options.postprocess;
		this.layers = clone(options.layers);
		for (const name in this.layers) {
			if (!Object.hasOwn(this.layers, name)) continue;
			const layer = this.layers[name];
			layer.name = name;
			assignDefaults(layer, {
				show: false, // By default, all layers have to be enabled manually
				brightness: 0.0,
				contrast: 1.0,
				blend: "",
				blendMode: "",
				maskBlendMode: "destination-in",
				alpha: 1.0,
				desaturate: false,
			});
			layer.defaultOptions = clone(layer); // deep copy
		}
		this.layerList = Object.values(this.layers);

		// Last used options
		this.options = { filters: {} };
		this.animated = false;
		this.canvas = null;
		this.rendererListener = null;
	}

	generatedOptions() {
		return [];
	}

	defaultOptions() {
		return {
			filters: {},
		};
	}

	createCanvas(cssAnimated) {
		return Renderer.createCanvas(this.width * (cssAnimated ? this.frames : 1), this.height);
	}

	reset() {
		this.options = {};
		for (const layer of this.layerList) {
			// Reset options
			jQuery.extend(true, layer, layer.defaultOptions);
		}
	}

	showLayer(name, filters) {
		const layer = this.layers[name];
		if (!layer) {
			console.error("Layer not found: " + this.name + "/" + name);
			return;
		}
		layer.show = true;
		for (const filter of filters) {
			if (filter === null || filter === undefined) continue; // null & undefined are allowed as "empty filter"
			if (typeof filter !== "object") {
				console.error("Invalid layer " + name + " filter " + typeof filter, filter);
				continue;
			}
			Object.assign(layer, filter);
		}
	}

	hideLayer(name) {
		const layer = this.layers[name];
		if (!layer) {
			console.error("Layer not found: " + this.name + "/" + name);
			return;
		}
		layer.show = false;
	}

	/**
	 * Update layers according to options and render them as static image.
	 *
	 * @param {CanvasRenderingContext2D} canvas Canvas to render on (can be created with {@link createCanvas}).
	 * @param {object} options Options to use when rendering model.
	 * @param {listener} listener For Renderer events.
	 */
	render(canvas, options, listener) {
		if (typeof options === "undefined") options = this.options;
		this.canvas = canvas;
		this.options = options;
		this.listener = listener;
		this.animated = false;
		this.redraw();
	}

	/**
	 * Update layers according to options and animate them.
	 *
	 * @param {CanvasRenderingContext2D} canvas Canvas to render on (can be created with {@link createCanvas}).
	 * @param {object} options Options to use when rendering model.
	 * @param {listener} listener For Renderer events.
	 * @returns {AnimatingCanvas} AnimatingCanvas object.
	 */
	animate(canvas, options, listener) {
		this.canvas = canvas;
		this.options = options;
		this.listener = listener;
		this.animated = true;
		return this.redraw();
	}

	/**
	 * Redraw the model onto same canvas.
	 */
	redraw() {
		if (!this.canvas) {
			Errors.report("CanvasModel.redraw() called but model was never rendered!");
			return;
		}
		Renderer.lastModel = this;

		if (this.animated) {
			return Renderer.animateLayers(this.canvas, this.compile(this.options), this.listener, true);
		} else {
			return Renderer.composeLayers(this.canvas, this.compile(this.options), this.canvas.canvas.width / this.width, this.listener);
		}
	}

	/**
	 * Pre-process options. Typically you calculate some expression here and store them as generated options
	 * Override in subclass.
	 *
	 * @param {options} options Model options.
	 */
	preprocess(options) {}

	/**
	 * @param {options} options Model options.
	 */
	postprocess(options) {}

	/**
	 * Compile list of layers according to options.
	 *
	 * @param {options} options Model options.
	 * @returns {CompositeLayerSpec[]} Layers.
	 */
	compile(options) {
		const debug = V.debug;
		if (!options) options = { filters: {} };
		if (!("filters" in options)) options.filters = {};
		try {
			this.preprocess(options);
		} catch (e) {
			console.error(e);
			throw new Error("Error in model preprocessing: " + e.stack.slice(0, e.stack.indexOf(Browser.isGecko ? "@" : "(eval")));
		}
		for (const layer of this.layerList) {
			// Reset some options
			layer.brightness = layer.defaultOptions.brightness;
			layer.contrast = layer.defaultOptions.contrast;
			layer.frameDx = 0;
			layer.frameDy = 0;
		}

		function propeval(layer, propname) {
			if (propname !== "show" && !debug && !layer.show) {
				// Situation A:
				// layer.srcfn: () => 'img/items/' + V.item.name + '.png'
				// and if V.item is undefined layer is skipped
				// So we don't want to eval skipped layer here
				//
				// Situation B:
				// Layer is skipped by mistake.
				// We want to debug its properties and show manually
				// So we might want to eval it still
				//
				// This is why we eval all properties in debug mode, but ignore their errors
				return;
			}
			const fnkey = propname + "fn";
			if (fnkey in layer) {
				try {
					layer[propname] = layer[fnkey](options);
				} catch (e) {
					if (layer.show) {
						throw e;
						console.error("Error evaluating layer " + layer.name + " property " + propname);
					}
				}
			}
		}

		const processLayer = layer => {
			layer.model = this;
			layer.show || propeval(layer, "show");
			propeval(layer, "src");
			if (!layer.src) {
				layer.src = ""; // force string value
				layer.show = false;
			}
			propeval(layer, "z");
			if (typeof layer.z !== "number" && layer.show !== false) {
				console.error("Layer " + layer.name + " missing property z");
			}
			propeval(layer, "alpha");
			propeval(layer, "maskAlpha");
			propeval(layer, "compositeOperation");
			propeval(layer, "blendMode");
			propeval(layer, "maskBlendMode");
			propeval(layer, "blend");
			propeval(layer, "desaturate");
			propeval(layer, "brightness");
			propeval(layer, "contrast");
			propeval(layer, "masksrc");
			propeval(layer, "animation");
			propeval(layer, "filters");
			propeval(layer, "dx");
			propeval(layer, "dy");
			propeval(layer, "width");
			propeval(layer, "height");
			propeval(layer, "worn");
			propeval(layer, "scale");
			if (!layer.scale) layer.scale = this.scale;
			if (layer.show !== false && layer.filters) {
				for (let filter of layer.filters) {
					if (typeof filter !== "object") {
						filter = options.filters[filter];
						if (!filter) {
							continue;
						}
					}
					if (!filter.blend) continue;
					Renderer.mergeLayerData(layer, filter, true);
				}
			}
		};

		for (const layer of this.layerList) {
			processLayer(layer);
		}

		this.postprocess(options);

		// Process generated layers after post-process
		const layers = [];
		if (options.generatedLayers) {
			for (const layer in options.generatedLayers) {
				processLayer(options.generatedLayers[layer]);
				layers.push(options.generatedLayers[layer]);
			}
		}

		return [...this.layerList, ...layers];
	}
}
window.CanvasModel = CanvasModel;

/**
 * @type {Object<string, CanvasModelOptions>}
 */
Renderer.CanvasModels = {};
/**
 * @type {Object<string, Object<string, CanvasModel>>}
 */
Renderer.CanvasModelCaches = {};
/**
 * Find or create new CanvasModel.
 *
 * @param {string} modelName CanvasModel name in Renderer.CanvasModels.
 * @param {string} [slot] Cache id to speed up rendering between passages.
 * @returns {CanvasModel}
 */
Renderer.locateModel = function (modelName, slot) {
	const options = Renderer.CanvasModels[modelName];
	if (!options) {
		Errors.report("Requested non-existing model " + modelName);
		return new CanvasModel({ name: "empty", width: 1, height: 1, layers: {} });
	}
	if (!slot) {
		return new CanvasModel(options);
	} else {
		let cache = Renderer.CanvasModelCaches[modelName];
		if (!cache) {
			cache = {};
			Renderer.CanvasModelCaches[modelName] = cache;
		}
		let model = cache[slot];
		if (model) return model;
		model = new CanvasModel(options);
		cache[slot] = model;
		return model;
	}
};

/**
 * Copies to targets keys from source that are not present there.
 * Shallow.
 *
 * @param {object} target Object to extend.
 * @param {object} source Default properties.
 * @returns {object} Target.
 */
function assignDefaults(target, source) {
	for (const k in source) {
		if (!Object.hasOwn(source, k)) continue;
		if (!(k in target)) target[k] = source[k];
	}
	return target;
}

/* globals normaliseFileName */
/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable jsdoc/no-undefined-types */
/* eslint-disable jsdoc/newline-after-description */
/* eslint-disable jsdoc/require-description-complete-sentence */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable no-useless-return */
/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
/* eslint-disable dot-notation */

/*
twine expression conversion (simple cases only):
replace (?<!["'\w])\$(?=\w) with V.
replace (?<!["'\w])_(?=\w) with T.
"to", "is", "gte" etc - fix manually
*/
// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
/**
 * MODEL OPTIONS
 * =============
 * See also defaultOptions()
 * Be careful searching for option usages in this file: there's a lot of computed-name property accesses
 * like options["arm_"+arm] or options["arm_"+arm]
 *
 * GROUP TOGGLES:
 * -------------
 * "show_face": boolean, default true
 * "show_hair": boolean, default true
 * "show_writings": boolean, default true
 * "show_tf": boolean, default true
 * "show_clothes": boolean, default true
 *
 * BODY OPTIONS:
 * -------------
 * "mannequin":boolean - use mannequin images
 * "breasts":""|"default"|"cleavage" - visible breasts
 * "breast_size":number - breast size tier 1..6
 * "crotch_visible":boolean - display crotch layers
 * "crotch_exposed":boolean - render crotch layers above clothes (unzipped)
 * "penis":""|"default"|"virgin" - has penis
 * "penis_size":number - penis size tier -1..5
 * "penis_parasite":""|"urchin"|"slime"|"parasite" - from $parasite.penis.name
 * "penis_condom": ""|"plain" - from $player.condom.type
 * "condom_colour": "" - from $player.condom.colour
 * "balls":boolean - has balls
 * "nipples_parasite":""|"urchin"|"slime" - from $parasite.nipples.name
 * "chest_parasite":""|"parasite" - from $parasite.breasts.name
 * "tummy_parasite":""|"urchin"|"slime" - from $parasite.tummy.name
 * "clit_parasite":""|"urchin"|"slime"|"parasite" - from $parasite.clit.name
 * "arm_left":"none"|"idle"|"cover" - left arm position ("cover" = covering breasts)
 * "arm_right":"none"|"idle"|"cover"|"hold" - right arm position ("cover" = covering crotch, "hold" = handheld item equipped)
 *
 * SKIN OPTIONS:
 * -------------
 * "skin_type": "wraith"|"light"|"medium"|"dark"|"gyaru"|"light"|"medium"|"dark"|"gyaru" -
 *              key of setup.colours.skin_gradients.
 *
 * HAIR OPTIONS:
 * -------------
 * "hair_colour":string - key from setup.colours.hair_map,
 *                        or "custom" (need to configure "hair" filter manually)
 * "hair_sides_type":string - side hair style or "" for no sides
 * "hair_sides_length":string - visible side hair length stage, "short".."feet"
 * "hair_sides_position":"front"|"back"
 * "hair_fringe_type":string - fringe style or "" for no fringe
 * "hair_fringe_length":string - visible fringe length stage, "short".."feet"
 * "brows_colour":string - key rom setup.colours.hair_map,
 *                         or "custom" (need to configure "brows" filter manually)
 *                         or "" (same as hair_colour) - this is the default
 * "pbhair_colour":string - pubic hair colour, key from setup.colours.hair_map,
 *                          or "custom" (need to configure "brows" filter manually)
 *                          or "" (same as hair_colour) - this is the default
 * "pbhair_level":number - pubic hair level, 0..9, 0 for none
 * "pbhair_strip":number - pubic hair strip level, 0..3. 0 for none
 * "pbhair_balls":number - pubic hair balls level, 0..9, 0 for none
 *
 * FACE OPTIONS:
 * -------------
 * "facevariant:" "default"|"catty"|"aloof"|"foxy"|"gloomy" - $facevariant variable, the img/face/{facestyle}/{facevariant} one.
 * "facestyle": "default" - $facestyle variable, the img/face/XXXX one.
 * "freckles": boolean
 * "trauma": boolean - traumatised state (empty eyes, less blinking)
 * "blink": boolean - blinking enabled
 * "eyes_half": boolean - eyes half closed
 * "eyes_bloodshot":boolean - bloodshot sclera
 * "left_eye": string - colour of left eye
 * "right_eye": string - colour of right eye
 * "brows": "none"|"top"|"low"|"orgasm"|"mid"
 * "mouth": "none"|"neutral"|"cry"|"frown"|"smile"|"chew"
 * "tears":number - tears level, 0..4, 0 is "no tears"
 * "blush":number - blush level, 0..5, 0 is "no blush"
 * "lipstick_colour": "" (none), key from setup.colours.lipstick_map, or "custom" ("lipstick" filter required)
 * "eyeshadow_colour": "" (none), key from setup.colours.eyeshadow_map, or "custom" ("eyeshadow" filter required)
 * "mascara_colour": "" (none), key from setup.colours.mascara_map, or "custom" ("mascara" filter required)
 * "mascara_running": number - mascara smear level, 0..4, 0 is "no smears"
 * "blusher_colour": "" (none), key from setup.colours.blusher_map, or "custom" ("blusher" filter required)
 * "makeup_adjustment": number - to determine makeup brightness based on tan level
 *
 * TF OPTIONS: ("disabled" & "hidden" types hide the layer)
 * ----------
 * "angel_wings_type": "disabled"|"hidden"|"default"
 * "angel_wing_right": "idle"|"cover"
 * "angel_wing_left": "idle"|"cover"
 * "angel_wings_layer": "front"|"back",
 * "angel_halo_type": "disabled"|"hidden"|"default"
 * "fallen_wings_type": "disabled"|"hidden"|"default"
 * "fallen_wing_right": "idle"|"cover"
 * "fallen_wing_left": "idle"|"cover"
 * "fallen_wings_layer": "front"|"back",
 * "fallen_halo_type": "disabled"|"hidden"|"default"
 * "demon_wings_type": "disabled"|"hidden"|"default"
 * "demon_wings_state": "idle"|"cover"|"flaunt"
 * "demon_wings_layer": "front"|"back",
 * "demon_tail_type": "disabled"|"hidden"|"default"|"classic"
 * "demon_tail_state": "idle"|"cover"|"flaunt"
 * "demon_tail_layer": "front"|"back"
 * "demon_horns_type": "disabled"|"hidden"|"default"|"classic"
 * "demon_horns_layer": "front"|"back"
 * "wolf_tail_type": "disabled"|"hidden"|"default"|"feral"
 * "wolf_tail_layer": "front"|"back"
 * "wolf_ears_type": "disabled"|"hidden"|"default"|"feral"
 * "wolf_pits_type": "disabled"|"hidden"|"default"
 * "wolf_pubes_type": "disabled"|"hidden"|"default"
 * "wolf_cheeks_type": "disabled"|"hidden"|"feral"
 * "cat_tail_type": "disabled"|"hidden"|"default"
 * "cat_tail_layer": "front"|"back"
 * "cat_ears_type": "disabled"|"hidden"|"default"
 * "cow_horns_type": "disabled"|"hidden"|"default"
 * "cow_horns_layer": "front"|"back"
 * "cow_tail_type": "disabled"|"hidden"|"default"
 * "cow_tail_layer": "front"|"back"
 * "cow_ears_type": "disabled"|"hidden"|"default"
 * "bird_wings_type": "disabled"|"hidden"|"default"
 * "bird_wing_right": "idle"|"cover"
 * "bird_wing_left": "idle"|"cover"
 * "bird_wings_layer": "front"|"back",
 * "bird_tail_type": "disabled"|"hidden"|"default"
 * "bird_tail_layer": "front"|"back"
 * "bird_eyes_type": "disabled"|"hidden"|"default"
 * "bird_malar_type": "disabled"|"hidden"|"default"
 * "bird_plumage_type": "disabled"|"hidden"|"default"
 * "bird_pubes_type": "disabled"|"hidden"|"default"
 * "fox_tail_type": "disabled"|"hidden"|"default"|
 * "fox_tail_layer": "front"|"back"
 * "fox_ears_type": "disabled"|"hidden"|"default"|
 * "fox_cheeks_type": "disabled"|"hidden"|
 *
 * BODY WRITING OPTIONS:
 * --------------------
 * For each body writing SLOT (key in $skin):
 * - "writing_SLOT" - key in setup.bodywwriting, "" for no writing
 *
 * DRIPPING FLUIDS OPTIONS:
 * -----------------------
 * "drip_vaginal": ""|"Start"|"VerySlow"|"Slow"|"Fast"|"VeryFast"
 * "drip_anal"   : ""|"Start"|"VerySlow"|"Slow"|"Fast"|"VeryFast"
 * "drip_mouth"  : ""|"Start"|"VerySlow"|"Slow"|"Fast"|"VeryFast"
 *
 * CLOTHING OPTIONS:
 * ----------------
 * For each clothing SLOT (key in $worn)
 * - "worn.SLOT.index":number - index of the worn item; 0 for no item
 * - "worn.SLOT.alpha":0..1 - opacity, default 1
 * - "worn.SLOT.integrity":"tattered"|"torn|"frayed"|"full" - integrity suffix attached to file name
 * - "worn.SLOT.colour":string - colour name, key from setup.colours.clothes_map
 *                               or "custom" (need to configure "worn_SLOT_custom" filter manually)
 * - "worn.SLOT.accColour":string - accessory colour name, key from setup.colours.clothes_map
 *                                   or "custom" (need to configure "worn_SLOT_acc_custom" filter manually)
 *
 * MISC OPTIONS:
 * -------------
 * "upper_tucked":boolean - $worn.upper tucked in $worn.lower
 * "lower_tucked":boolean - $worn.lower tucked in $worn.feet
 * "hood_down":boolean - hood is pulled down
 * "facewear_layer": "front"|"back"
 *
 * GENERATED OPTIONS (temp variables configured by the model itself in preprocess())
 * ------------------
 * "genitals_chastity":boolean - $worn.genitals type has 'chastity'
 * "handheld_overhead":boolean - $worn.handheld type includes 'rainproof' or $worn.handheld.name includes "balloon"
 * "blink_animation":string - "blink"|"blink-trauma"|null
 * "zarms":number - Z-index of arms
 * "zupper":number - Z-index of "upper" clothing
 *
 * =============
 * MODEL FILTERS
 * =============
 * Following filters are required if related colour option is "custom",
 *  - "hair_custom"
 *  - "pbhair_custom"
 *  - "brows_custom"
 *  - "eyes_custom"
 *  - "eyeshadow_custom"
 *  - "mascara_custom"
 *  - "blusher_custom"
 *  - "lipstick_custom"
 * Following filters are generated by applying sprite prefilter to custom or predefined colour
 *  - "hair"
 *  - "pbhair"
 *  - "brows"
 *  - "eyes"
 *  - "eyeshadow"
 *  - "mascara"
 *  - "blusher"
 *  - "lipstick"
 *
 * CLOTHING COLOUR FILTERS
 * -----------------------
 * For each clothing SLOT:
 * - "worn_SLOT_custom" - required is options.worn_SLOT_colour is "custom"
 * - "worn_SLOT_acc_custom" - required is options.worn_SLOT_acc_colour is "custom"
 * - "worn_SLOT" - generated from sprite prefilter and custom or predefined colour
 * - "worn_SLOT_acc" - generated from sprite prefilter and custom or predefined colour
 */
Renderer.CanvasModels.main = {
	name: "main",
	width: 256,
	height: 256,
	frames: 2,
	scale: true, // Can be overridden for each layer
	generatedOptions() {
		return [
			"blink_animation",
			"coinFlip",
			"genitals_chastity",
			"handheld_overhead",
			"zarms",
		]
	},
	defaultOptions() {
		return {
			"clothesPath": "img/clothes/",
			// group toggles
			"show_face": true,
			"show_hair": true,
			"show_writings": true,
			"show_tf": true,
			"show_clothes": true,
			// body
			"mannequin": false,
			"breasts": "",
			"breast_size": 1,
			"crotch_visible": false,
			"crotch_exposed": false,
			"penis": "",
			"penis_size": -1,
			"penis_parasite": "",
			"penis_condom": "",
			"condom_colour": "",
			"balls": false,
			"nipples_parasite": "",
			"chest_parasite": "",
			"clit_parasite": "",
			"arm_left": "idle",
			"arm_right": "idle",
			"body_type": "classic",
			// Skin & tan
			"skin_type": "light",
			"skin_tone": 0,
			"skin_scars":false,
			// Hair
			"hair_colour": "red",
			"hair_colour_gradient": {
				style: "split",
				colours: ["red", "black"]
			},
			"hair_colour_style": "simple",
			"hair_sides_type": "default",
			"hair_sides_length": "short",
			"hair_sides_position": "back",
			"hair_fringe_colour": "red",
			"hair_fringe_colour_gradient": {
				style: "split",
				colours: ["red", "black"]
			},
			"hair_fringe_colour_style": "simple",
			"hair_fringe_type": "default",
			"hair_fringe_length": "short",
			"brows_colour": "",
			"brows_position": "front",
			"pbhair_colour": "",
			"pbhair_level": 0,
			"pbhair_strip": 0,
			"pbhair_balls": 0,
			// Face
			"facestyle": "default",
			"facevariant": "default",
			"ears_position": "back",
			"freckles": false,
			"trauma": false,
			"blink": true,
			"eyes_half": false,
			"eyes_bloodshot": false,
			"left_eye": "purple",
			"right_eye": "purple",
			"brows": "none",
			"mouth": "none",
			"tears": 0,
			"blush": 0,
			"toast": 0,
			"lipstick_colour": "",
			"eyeshadow_colour": "",
			"mascara_colour": "",
			"mascara_running": 0,
			"blusher_colour": "",
			"makeup_adjustment": 0,
			// tf
			"angel_wings_type": "disabled",
			"angel_wing_right": "idle",
			"angel_wing_left": "idle",
			"angel_wings_layer": "front",
			"angel_halo_type": "disabled",
			"angel_halo_lower": false,
			"fallen_wings_type": "disabled",
			"fallen_wing_right": "idle",
			"fallen_wing_left": "idle",
			"fallen_wings_layer": "front",
			"fallen_halo_type": "disabled",
			"demon_wings_type": "disabled",
			"demon_wings_state": "idle",
			"demon_wings_layer": "front",
			"demon_tail_type": "disabled",
			"demon_tail_state": "idle",
			"demon_tail_layer": "front",
			"demon_horns_type": "disabled",
			"demon_horns_layer": "back",
			"wolf_tail_type": "disabled",
			"wolf_tail_layer": "front",
			"wolf_ears_type": "disabled",
			"wolf_pits_type": "disabled",
			"wolf_pubes_type": "disabled",
			"wolf_cheeks_type": "disabled",
			"cat_tail_type": "disabled",
			"cat_tail_state": "idle",
			"cat_tail_layer": "front",
			"cat_ears_type": "disabled",
			"cow_horns_type": "disabled",
			"cow_horns_layer": "back",
			"cow_tail_type": "disabled",
			"cow_tail_layer": "front",
			"cow_ears_type": "disabled",
			"bird_wings_type": "disabled",
			"bird_wing_right": "idle",
			"bird_wing_left": "idle",
			"bird_wings_layer": "front",
			"bird_tail_type": "disabled",
			"bird_tail_layer": "front",
			"bird_eyes_type": "disabled",
			"bird_malar_type": "disabled",
			"bird_plumage_type": "disabled",
			"bird_pubes_type": "disabled",
			"fox_tail_type": "disabled",
			"fox_tail_layer": "front",
			"fox_ears_type": "disabled",
			"fox_cheeks_type": "disabled",
			"tf_ears_layer": "back",
			// body writings
			"writing_forehead": "",
			"writing_left_cheek": "",
			"writing_right_cheek": "",
			"writing_breasts": "",
			"writing_left_shoulder": "",
			"writing_right_shoulder": "",
			"writing_pubic": "",
			"writing_left_thigh": "",
			"writing_right_thigh": "",
			// fluids
			"drip_vaginal": "",
			"drip_anal": "",
			"drip_mouth": "",
			"cum_chest": "",
			"cum_face": "",
			"cum_feet": "",
			"cum_leftarm": "",
			"cum_rightarm": "",
			"cum_neck": "",
			"cum_thigh": "",
			"cum_tummy": "",
			// clothing
			"worn": {
				upper: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				genitals: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				over_upper: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				lower: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				over_lower: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				under_lower: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				under_upper: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				hands: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				handheld: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				head: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				over_head: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				face: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				neck: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				legs: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				},
				feet: {
					index: 0,
					alpha: 1,
					integrity: "full",
					colour: "white",
					accColour: "white",
					pattern: 0,
					setup: { type: [] },
				}
			},
			// followers
			"follower": false,
			//weather
			"precipitation_back": "",
			"precipitation_front": "",
			"cold_breath": "",
			"water_back": "",
			"water_front": "",
			"water_breath": "",
			"fire_back": "",
			"fire_front": "",
			// misc
			"tanningEnabled": true,
			"genitals_chastity": false, // generated option
			"handheld_overhead": false, // generated option
			"upper_tucked": false,
			"lower_tucked": false,
			"hood_down": false,
			"alt_sleeve": false,
			"acc_layer_under": false,
			"belly_mask_src": "", // generated option
			"blink_animation": "", // generated option
			"zarms": ZIndices.armsidle, // generated options
			"zupper": ZIndices.upper, // generated options
			"zupperleft": ZIndices.upper_arms, // generated options
			"zupperright": ZIndices.upper_arms, // generated options
			// filters
			"filters": {
				body: { blend: "#ffffff", blendMode: "multiply", desaturate: false },
			},
		}
	},
	/*
	 *	██████  ██████  ███████ ██████  ██████   ██████   ██████ ███████ ███████ ███████
	 *	██   ██ ██   ██ ██      ██   ██ ██   ██ ██    ██ ██      ██      ██      ██
	 *	██████  ██████  █████   ██████  ██████  ██    ██ ██      █████   ███████ ███████
	 *	██      ██   ██ ██      ██      ██   ██ ██    ██ ██      ██           ██      ██
	 *	██      ██   ██ ███████ ██      ██   ██  ██████   ██████ ███████ ███████ ███████
	 */
	preprocess(options) {
		// Generate base skin tones
		options.filters.body = setup.colours.getSkinFilter(options.skin_type, 0);
		if (options.skin_type !== "custom") {
			options.filters.tan = setup.colours.getSkinFilter(options.skin_type, options.skin_tone);
		}

		const blink = options.trauma ? "blink-trauma" : "blink";
		options.blink_animation = options.blink ? blink : "";
		options.handheld_animation = V.worn.handheld.name === "heart hand warmer" ? "handWarmer" : "idle";

		options.filters.left_eye = lookupColour(options, setup.colours.eyes_map, options.left_eye, "eyes", "eyes_custom", "eyes");
		options.filters.right_eye = lookupColour(options, setup.colours.eyes_map, options.right_eye, "eyes", "eyes_custom", "eyes");

		if (options.hair_colour_style === "gradient") {
			options.filters.hair = createHairColourGradient(
				"sides",
				options.hair_colour_gradient,
				options.hair_sides_type,
				hairLengthStringToNumber(options.hair_sides_length),
				"hair"
			);
		}
		if (options.hair_colour_style === "simple") {
			options.filters.hair = lookupColour(
				options,
				setup.colours.hair_map,
				options.hair_colour,
				"hair",
				"hair_custom",
				"hair"
			);
		}
		if (options.hair_fringe_colour_style === "gradient") {
			options.filters.hair_fringe = createHairColourGradient(
				"fringe",
				options.hair_fringe_colour_gradient || options.hair_colour_gradient,
				options.hair_fringe_type,
				hairLengthStringToNumber(options.hair_sides_length),
				"hair_fringe"
			);
		}
		if (options.hair_fringe_colour_style === "simple") {
			options.filters.hair_fringe = lookupColour(
				options,
				setup.colours.hair_map,
				options.hair_fringe_colour || options.hair_colour,
				"hair_fringe",
				"hair_fringe_custom",
				"hair_fringe"
			);
		}

		const empty = Renderer.emptyLayerFilter();
		options.filters.brows = lookupColour(options, setup.colours.hair_map, options.brows_colour || options.hair_colour, "brows", "brows_custom", "brows");
		options.filters.pbhair = lookupColour(options, setup.colours.hair_map, options.pbhair_colour || options.hair_colour, "pbhair", "pbhair_custom", "pbhair");
		options.filters.lipstick = (options.lipstick_colour) ? lookupColour(
			options, setup.colours.lipstick_map, options.lipstick_colour, "lipstick", "lipstick_custom", "lipstick"
		) : empty;
		options.filters.eyeshadow = (options.eyeshadow_colour) ? lookupColour(
			options, setup.colours.eyeshadow_map, options.eyeshadow_colour, "eyeshadow", "eyeshadow_custom", "eyeshadow"
		) : empty;
		options.filters.mascara = (options.mascara_colour) ? lookupColour(
			options, setup.colours.mascara_map, options.mascara_colour, "mascara", "mascara_custom", "mascara"
		) : empty;

		if (options.condom_colour) options.filters.condom = lookupColour(options, setup.colours.condom_map, options.condom_colour, "condom", "condom_custom", "condom");

		if (options.breasts_parasite === "parasite") {
			options.filters.breasts_parasite = lookupColour(options, setup.colours.clothes_map, "red", "breasts_parasite");
		}
		if (options.ear_slime_panties) {
			options.filters.ear_slime = lookupColour(options, setup.colours.clothes_map, "red", "ear_slime");
		}
		if (options.prop?.colour && options.prop?.colour !== "hair") {
			options.filters.prop = lookupColour(options, setup.colours.clothes_map, options.prop.colour, "prop");
		}
		if (options.prop?.accColour && options.prop?.accColour !== "hair") {
			options.filters.prop_acc = lookupColour(options, setup.colours.clothes_map, options.prop.accColour, "prop");
		}
		// Calculate blend pattern for demon TF
		const filterBase = {
			blendMode: "hard-light",
			brightness: 0,
			contrast: 1,
			desaturate: false,
		};
		// eslint-disable-next-line no-undef
		const demonHsl = ColourUtils.toHslString(Transformations.defaults.demon.colour);
		options.filters.demon_wings = { ...filterBase, blend: ColourUtils.toHslString(V.transformationParts.demon.wings_colour, demonHsl) };
		options.filters.demon_tail = { ...filterBase, blend: ColourUtils.toHslString(V.transformationParts.demon.tail_colour, demonHsl) };
		options.filters.demon_horns = { ...filterBase, blend: ColourUtils.toHslString(V.transformationParts.demon.horns_colour, demonHsl) };

		// Clothing filters and options
		const clothingObject = this.defaultOptions().worn;
		for (const slot of setup.clothes_all_slots) {
			const index = options.worn[slot]?.index ?? -1;
			if (index <= -1) continue;
			// Merge with default options
			clothingObject[slot].deepMerge(options.worn[slot]);

			let setupObj = clothingObject[slot].setup;
			if (!setupObj.variable) {
				setupObj = setup.clothes[slot][index];
				clothingObject[slot].setup = setupObj
			}

			setClothingFilter(options, slot, clothingObject[slot], setupObj, '', 'colour_sidebar', 'colour');
			setClothingFilter(options, slot, clothingObject[slot], setupObj, '_acc', 'accessory_colour_sidebar', 'accColour');
		}
		options.worn = clothingObject;

		// Show arm and hand just below outermost clothes layer to fully show its main/breasts layer and hide others
		// -0.1 is to move arms behind sleeves; to display gloves above sleeves they get +0.2 in hand layer decls

		if (options.worn.over_upper.index) {
			options.zarms = ZIndices.over_upper_arms - 0.1;
		} else if (options.worn.upper.index) {
			if (options.arm_left === "cover") {
				if (options.upper_tucked) {
					options.zarms = ZIndices.upper_arms_tucked - 0.1;
				} else {
					options.zarms = ZIndices.upper_arms - 0.1;
				}
			} else {
				options.zarms = ZIndices.under_upper_arms - 0.1;
			}
		} else if (options.worn.under_upper.index) {
			options.zarms = ZIndices.under_upper_arms - 0.1;
		} else {
			options.zarms = ZIndices.armsidle
		}


		// Do not put skin above sleeves
		if (options.worn.under_upper.setup.sleeve_img === 1) {
			options.zarms = ZIndices.under_upper_arms - 0.1;
		} else if (options.worn.upper.setup.sleeve_img === 1) {
			if (options.arm_left === "cover") {
				if (options.upper_tucked) {
					options.zarms = ZIndices.upper_arms_tucked - 0.1;
				} else {
					options.zarms = ZIndices.upper_arms - 0.1;
				}
			} else {
				options.zarms = ZIndices.under_upper_arms - 0.1;
			}
		}

		options.hide_all = false;
		if (options.worn.upper.setup.name === "cocoon") {
			options.hide_all = true;
			options.show_hair = false;
		};

		options.zupper = (options.upper_tucked) ? ZIndices.upper_tucked : ZIndices.upper;
		options.zupperleft = (options.upper_tucked) ? ZIndices.upper_arms_tucked : ZIndices.upper_arms;
		options.zupperright = (options.upper_tucked) ? ZIndices.upper_arms_tucked : ZIndices.upper_arms;

		if (options.arm_right === "cover" || options.arm_right === "hold") options.zupperright = ZIndices.right_cover_arm + 1;
		if (options.arm_left === "cover") options.zupperleft = ZIndices.left_cover_arm + 1;
		if (options.worn.head.setup.name === "sage witch hat") {
			const ears = isPartEnabled(options.fox_ears_type) || isPartEnabled(options.wolf_ears_type) || isPartEnabled(options.cat_ears_type)
			if (ears) options.hideHeadAcc = true;
		}
		if (options.worn.neck.setup.name === "familiar collar") {
			if (T.magicLeash) {
				// For debug purposes to determine leash escapes
				V.magicLeashPassage = V.passage;
				V.magicLeashPassagePrev = V.passagePrev;
			} else if (!V.worn.neck.type.includes("leash")) {
				options.hideLeash = true;
			}
		}

		// Generate mask images
		options.lowerMask = [];
		options.lowerBellyMask = [];
		options.lowerShadowMask = [];
		options.underLowerMask = [];
		options.underLowerShadowMask = [];
		options.underUpperMask = [];
		options.upperMask = [];
		options.legsMask = [];
		options.headMask = [];
		if (options.worn.lower.setup.mask_img === 1) {
			options.lowerMask.push(`img/clothes/lower/${options.worn.lower.setup.variable}/${options.worn.lower.integrity}.png`)
		}
		if (options.worn.upper.setup.mask_img === 1) {
			options.upperMask.push(`img/clothes/upper/${options.worn.upper.setup.variable}/${options.worn.upper.integrity}.png`)
		}

		const hairTails = ["curly pigtails", "fluffy ponytail", "thick sidetail", "thick twintails", "ribbon tail", "thick sidetail", "thick ponytail", "half-up"];
		const thickTails = ["scorpion tails", "thick pigtails", "thick twintails"];
		const furCap = ["furcap f", "furcap m"];
		if (
			options.worn.over_head.setup.mask_img === 1
			&& !(options.hood_down && options.worn.over_head.setup.hood && options.worn.over_head.setup.outfitSecondary !== undefined)
		) {
			options.headMask.push(`img/clothes/over_head/${options.worn.over_head.setup.variable}/mask.png`);
		}
		if (
			options.worn.head.setup.mask_img === 1
			&& !(options.hood_down && options.worn.head.setup.hood && options.worn.head.setup.outfitSecondary !== undefined)
		) {
			if (
				options.worn.head.setup.mask_img_ponytail === 1
				&& hairTails.includes(options.hair_sides_type)
				|| thickTails.includes(options.hair_sides_type)
				&& furCap.includes(options.worn.head.setup.variable)
			) {
				options.headMask.push(`img/clothes/head/${options.worn.head.setup.variable}/mask-ponytail.png`);
			} else {
				options.headMask.push(`img/clothes/head/${options.worn.head.setup.variable}/mask.png`);
			}
		}
		if (options.worn.handheld.setup.mask_img === 1) {
			options.headMask.push(`img/clothes/handheld/${options.worn.handheld.setup.variable}/mask.png`);
		}

		if (["fro", "afro pouf", "afro puffs"].includes(options.hair_sides_type) && options.hair_fringe_type === "fro") {
			options.fringe_mask_src = `img/hair/fringe/${options.hair_fringe_type}/mask.png`;
		} else {
			options.fringe_mask_src = null;
		}

		if (
			options.worn.upper.setup.type.includes("bellyHide")
			|| options.worn.lower.setup.type.includes("bellyHide")
			|| !V.worn.over_upper.type.includes("naked")
		) {
			options.belly -= 3;
		}

		const bellyDir = "img/clothes/belly"
		if (between(options.belly, 8, 24)) {
			options.belly_mask_lower_shadow_src = `${bellyDir}/shadow-${options.belly}.png`;
			options.lowerShadowMask.push(options.belly_mask_lower_shadow_src);
			options.underLowerShadowMask.push(options.belly_mask_lower_shadow_src);
			options.belly_mask_upper_shadow_src = `${bellyDir}/shadow-${options.belly}.png`;
		}

		if (between(options.belly, 15, 24)) {
			options.belly_mask_src = options.worn.upper.setup.pregType == "min" ?
				`${bellyDir}/mask-min-${options.belly}.png` : `${bellyDir}/mask-${options.belly}.png`;
			options.lowerBellyMask.push(options.belly_mask_src);

			if (V.worn.upper.outfitPrimary == undefined && options.worn.lower.setup.pregType !== "cover") {
				if (options.belly >= 19) {
					options.belly_hides_lower = true;
					options.belly_mask_clip_src = `${bellyDir}/mask-clip-${options.belly}.png`;
					options.lowerMask.push(options.belly_mask_clip_src);
					options.legsMask.push(options.belly_mask_clip_src);

					const check = options.worn.upper.setup.pregType == "split";
					const suffix = options.belly >= 22 ? "-big.png" : ".png";
					options.shirt_mask_clip_src = check ? `${bellyDir}/mask-shirt-clip${suffix}` : null;
					options.shirt_move_left_src = check ? `${bellyDir}/mask-shirt-left${suffix}` : null;
					options.shirt_move_left2_src = check ? `${bellyDir}/mask-shirt-left2.png` : null;
					options.shirt_move_right_src = check ? `${bellyDir}/mask-shirt-right.png` : null;
					options.shirt_move_right2_src = check ? `${bellyDir}/mask-shirt-right2.png` : null;
					options.shirt_move_right3_src = check ? `${bellyDir}/mask-shirt-right3.png` : null;

					if (check) options.shirt_mask_breasts_src = `${bellyDir}/mask-shirt-breasts.png`;
				} else {
					options.belly_mask_clip_src = null;
				}
			}

			if (V.worn.under_upper.outfitPrimary == undefined) {
				options.belly_hides_under_lower = true;
				options.underLowerMask.push(`${bellyDir}/mask-clip-${options.belly}.png`);
				options.underLowerShadowMask.push(`${bellyDir}/mask-clip-${options.belly}.png`);
			}
		}

		/*
		TODO: Find a better solution for preventing underwear from clipping through pants without under-lower clothes disappearing - Song on behalf of Kirsty

		if (!options.worn.lower.setup.type.includes("naked")) {
			const isAltPosition = !options.alt_override && setup.altposition !== undefined
				&& options.worn.lower.alt === "alt"
				&& !setup.altdisabled.includes("full");
			const pattern = options.worn.lower.pattern && !["secondary", "tertiary"].includes(options.worn.lower.setup.pattern_layer) ? "-" + options.worn.lower.pattern?.replace(/ /g,"-") : '';
			const end = isAltPosition ? '-alt' : '';

			options.underLowerMask.push(`img/clothes/lower/${options.worn.lower.setup.variable}/${options.worn.lower.integrity}${pattern}${end}.png`);
		}
		*/

		const notMasc = ["curvy", "slender"].includes(options.body_type);
		const soft = options.body_type === "soft" && !(between(options.belly, 8, 24));
		if (notMasc && options.breasts === "cleavage") {
			const suffix = between(options.breast_size, 3, 4) ? "-3-4.png" : ".png";
			options.breasts_mask_src = `img/body/breasts/mask-${options.body_type}${suffix}`
		} else {
			options.breasts_mask_src = null;
		}

		if (
			options.worn.neck.setup.name === "suspenders"
			&& options.worn.neck.setup.altposition != "alt"
			&& ["retro shorts", "retro trousers", "baseball shorts", "wide leg trousers"].includes(options.worn.lower.setup.name)
		) {
			options.high_waist_suspenders = true;
		} else {
			options.high_waist_suspenders = null;
		}

		if (notMasc) {
			["upper", "under_upper"].forEach(slot => {
				const isFormfitting = options.worn[slot].setup.formfitting;
				options[`${slot}_fitted_clip_src`] = isFormfitting ? `img/clothes/masks/formfitting-${options.body_type}.png` : null;
				options[`${slot}_fitted_right_move_src`] = isFormfitting ? "img/clothes/masks/formfitting-right-move.png" : null;
				options[`${slot}_fitted_left_move_src`] = isFormfitting ? "img/clothes/masks/formfitting-left-move.png" : null;
			});
		} else if (soft) {
			const upperCheck = !(options.worn.lower.setup.outfitSecondary && options.worn.lower.setup.outfitSecondary[1] === options.worn.upper.setup.name) && !options.worn.lower.setup.type.includes("overalls") && !options.high_waist_suspenders && !options.belly_mask_clip_src;
			const underUpperCheck = !(options.worn.under_lower.setup.outfitSecondary && options.worn.under_lower.setup.outfitSecondary[1] === options.worn.under_upper.setup.name) && !options.belly_mask_clip_src;
			["upper", "under_upper"].forEach(slot => {
				options[`${slot}_fitted_right_move_src`] = "img/clothes/masks/soft-right-move.png";
				options[`${slot}_fitted_left_move_src`]  = "img/clothes/masks/soft-left-move.png";
			});
			options.lowerMask.push(upperCheck && !options.belly_tucked ? "img/clothes/masks/soft-lower-clip.png" : null);
			options.legsMask.push(upperCheck && !options.belly_tucked ? "img/clothes/masks/soft-lower-clip.png" : null);
			options.lowerShadowMask.push(upperCheck ? "img/clothes/masks/soft-shadow.png" : null);
			options.underLowerShadowMask.push(underUpperCheck ? "img/clothes/masks/soft-shadow.png" : null);
			options.underLowerMask.push(underUpperCheck? "img/clothes/masks/soft-lower-clip.png" : null);
		}

		if (options.lower_tucked && !options.worn.lower.setup.notuck && !options.worn.feet.setup.notuck) {
			options.feet_clip_src = `img/clothes/feet/${options.worn.feet.setup.variable}/mask.png`;
			options.lowerMask.push(options.feet_clip_src);
			options.legsMask.push(options.feet_clip_src);
			options.lowerBellyMask.push(options.feet_clip_src);
		} else if (!options.worn.feet.setup.notuck) {
			options.legsMask.push(`img/clothes/feet/${options.worn.feet.setup.variable}/mask.png`)
		} else {
			options.feet_clip_src = null;
		}

		options.genitals_chastity = options.worn.genitals.setup.type.includes("chastity");

		if (options.worn.handheld.setup.zIndex === "over_head" ) {
			options.handheld_overhead = true;
			options.angel_halo_lower = options.arm_right !== "cover";
		} else {
			options.handheld_overhead = null;
			options.angel_halo_lower = false;
		}

		options.genitals_chastity = options.worn.genitals.setup.type.includes("chastity");

		if (
			options.worn.head.setup.mask_img === 1
			&& !(options.hood_down && options.worn.head.setup.hood && options.worn.head.setup.outfitSecondary !== undefined)
		) {
			options.hood_mask = true;
		} else {
			options.hood_mask = null;
		}

		if (options.shirt_mask_clip_src) {
			options.underUpperMask.push(options.shirt_mask_clip_src)
			options.upperMask.push(options.shirt_mask_clip_src)
		} else {
			options.underUpperMask.push(options.under_upper_fitted_clip_src)
			options.upperMask.push(options.upper_fitted_clip_src)
		};


		/*clothes whose sleeves cannot be rolled up*/
		if (options.worn.upper.setup.variable === "schoolcardigan" && options.worn.upper.alt !== "alt") {
			options.alt_sleeve_state = null;
		} else {
			options.alt_sleeve_state = true;
		}
		T.canvasOptions = options;
	},
	postprocess(options) {
		options.generatedLayers = {};

		if (options.tanningEnabled) {
			if (V.options.tanLines) {
				if (!Skin.cachedLayers) {
					const canvasModel = this;

					// Don't modify the original options object
					const newOptions = canvasModel.options.deepCopy();

					// Highest tanning values are added first
					const tanningGroups = [...Skin.tanningLayers].sort((a, b) => a.value - b.value);

					for (let i = 0; i < tanningGroups.length; i++) {
						const layerGroup = tanningGroups[i];
						if (layerGroup.layers.length === 0) continue;

						// For every item in tanning layers, create a new entry in options.worn and set up the filters
						for (const [slot, props] of Object.entries(layerGroup.slots)) {
							const item = {
								index: Number(props.index),
								integrity: props.integrity ?? "full",
								alt: props.alt,
								pattern: props.pattern,
								colour: props.colour || "black",
								accColour: props.accColour || "black",
								setup: setup.clothes[slot][props.index],
							  };														  newOptions.worn[slot] = { ...newOptions.worn[slot], ...item };
							// Set up the filters for the tanning layer in order to choose the correct sprites
							// Uses default "black" colour since undefined will try to load the incorrect path
							setClothingFilter(newOptions, slot, item, item.setup, '', 'colour_sidebar', 'colour');
							setClothingFilter(newOptions, slot, item, item.setup, '_acc', 'accessory_colour_sidebar', 'accColour');
						}

						// Get the source paths for the tanning layer
						// Filter out non-unique rows
						const layers = { arms: [], body: [] };
						for (const layerName of layerGroup.layers) {
							const layer = canvasModel.layers[layerName];

							// Set offsets (mostly for preg belly)
							const srcObject = {
								path: layer.srcfn(newOptions),
								offsetX: layer.dxfn ? layer.dxfn(newOptions) : 0,
								offsetY: layer.dyfn ? layer.dyfn(newOptions) : 0,
							};

							const target = layerName.includes("rightarm") || layerName.includes("leftarm") ? layers.arms : layers.body;
							if (!target.some(item => item.path === srcObject.path && item.offsetX === srcObject.offsetX)) {
								target.push(srcObject);
							}
						}

						// Generate final tanning layers
						// Separate the base with the arms, since they can overlap
						// Base layer has disabled animations
						const alpha = layerGroup.value * (["gyaru", "rgyaru", "ygyaru", "ggyaru", "bgyaru"].includes(options.skin_type) ? 0.3 : 1);
						if (layers.body.length) {
							options.generatedLayers[`tan_base${i}`] = (genlayer_tanning("base", i, layers.body, alpha, null));
							options.generatedLayers[`tan_breasts${i}`] = (genlayer_tanning("breasts", i, layers.body, alpha));
							options.generatedLayers[`tan_belly${i}`] = (genlayer_tanning("belly", i, layers.body, alpha));
						}
						if (layers.arms.length) {
							options.generatedLayers[`tan_leftarm${i}`] = (genlayer_tanning("leftarm", i, layers.arms, alpha));
							options.generatedLayers[`tan_rightarm${i}`] = (genlayer_tanning("rightarm", i, layers.arms, alpha));
						}
					}
					Skin.cachedLayers = options.generatedLayers;
				} else {
					options.generatedLayers = Skin.cachedLayers;
				}
			}

			// Only use necessary data for tanning layers. Filter out the rest.
			// Only clothing items that aren't handheld or headwear will be used
			// Only use the base pregnancy layers
			const skippedSlots = ["handheld", "head", "neck", "face", "under_upper_belly_", "upper_belly_", "under_lower_belly_", "lower_belly_"];
			this.tanningLayers = this.layerList
				.filter(obj => obj.show === true
					&& obj.worn
					&& !skippedSlots.some(prefix => obj.name.startsWith(prefix))
				).reduce((acc, obj) => {
					if (!acc.layers.includes(obj.name)) {
						acc.layers.push(obj.name);
					}

					acc.slots[obj.worn.slot] = {
						index: obj.worn.index,
						  ...(obj.worn.integrity !== "full" && { integrity: obj.worn.integrity }),
						  ...(obj.worn.alt !== undefined && { alt: obj.worn.alt }),
						  ...(options.worn[obj.worn.slot].pattern !== undefined && { pattern: options.worn[obj.worn.slot].pattern }),
						};
					return acc;
				}, { layers: [], slots: {} });
		}
	},
	layers: {
		// banner comments generated in http://patorjk.com/software/taag/#p=display&c=c&f=ANSI%20Regular&t=base
		/***
		 *    ██████   █████  ███████ ███████
		 *    ██   ██ ██   ██ ██      ██
		 *    ██████  ███████ ███████ █████
		 *    ██   ██ ██   ██      ██ ██
		 *    ██████  ██   ██ ███████ ███████
		 *
		 *
		 */
		"base": {
			show: true,
			filters: ["tan"],
			z: ZIndices.base,
			animation: "idle",

			srcfn(options) {
				return options.mannequin ? "img/body/mannequin/base-body.png" : `img/body/base-${options.body_type}.png`;
			},
		},
		"basehead": {
			show: true,
			filters: ["tan"],
			z: ZIndices.basehead,
			animation: "idle",

			srcfn(options) {
				return options.mannequin ? "img/body/mannequin/base-head.png" : "img/body/base-head.png";
			},
		},
		"breasts": {
			show: true,
			filters: ["tan"],
			z: ZIndices.breasts,
			animation: "idle",

			masksrcfn(options) {
				return options.breasts_mask_src;
			},
			srcfn(options) {
				const mannequin = (options.mannequin) ? "mannequin/" : "";
				const prefix = `img/body/${mannequin}`;
				const breasts = options.breasts === "cleavage" && options.breast_size >= 3 ? "clothed" : "breasts";
				return `${prefix}breasts/${breasts}-${options.breast_size}.png`;
			},
		},
		"belly": {
			filters: ["tan"],
			z: ZIndices.bellyBase,
			animation: "idle",

			showfn(options) {
				return !!options.belly
			},
			srcfn(options) {
				return between(options.belly, 1, 24) ? `img/body/pregnant-belly/${options.belly}.png` : "";
			},
		},
		"bellyLeft": {
			filters: ["tan"],
			z: ZIndices.bellyBase,
			animation: "idle",

			showfn(options) {
				return !!options.belly
			},
			srcfn(options) {
				return options.body_type === "soft" && between(options.belly, 11, 14) ? `img/body/pregnant-belly/${options.belly}.png` : "";
			},
			masksrcfn(options) {
				return options.upper_fitted_left_move_src;
			},
			dxfn(options) {
				return 2;
			},
		},
		"bellyRight": {
			filters: ["tan"],
			z: ZIndices.bellyBase,
			animation: "idle",

			showfn(options) {
				return !!options.belly
			},
			srcfn(options) {
				return options.body_type === "soft" && between(options.belly, 11, 14) ? `img/body/pregnant-belly/${options.belly}.png` : "";
			},
			masksrcfn(options) {
				return options.upper_fitted_right_move_src;
			},
			dxfn(options) {
				return -2;
			},
		},
		"nipples_parasite": {
			z: ZIndices.breastsparasite + 0.1,
			animation: "idle",

			showfn(options) {
				return !!options.nipples_parasite;
			},
			srcfn(options) {
				switch (options.nipples_parasite) {
					case "urchin":
						return `img/body/breasts/urchin-${options.breast_size}.png`;
					case "slime":
						return `img/body/breasts/slime-${options.breast_size}.png`;
					default:
						return "";
				}
			},
		},
		"breasts_parasite": {
			filters: ["breasts_parasite"],
			z: ZIndices.breastsparasite,
			animation: "idle",

			showfn(options) {
				return !!options.breasts_parasite;
			},
			srcfn(options) {
				return options.breasts_parasite === 'parasite' ? `img/body/breasts/ear-slime-${options.breast_size}.png` : "";
			},
		},
		"leftarm": {
			filters: ["tan"],
			animation: "idle",

			zfn(options) {
				return (options.arm_left === "cover") ? ZIndices.left_cover_arm : ZIndices.armsidle;
			},
			showfn(options) {
				return options.arm_left !== "none";
			},
			srcfn(options) {
				if (options.mannequin) return "img/body/mannequin/left-arm-idle.png";
				if (options.arm_left === "cover") return "img/body/left-arm-cover.png";
				return `img/body/left-arm-idle-${options.body_type}.png`;
			},
		},
		"rightarm": {
			filters: ["tan"],
			animation: "idle",

			zfn(options) {
				if (["cover", "hold"].includes(options.arm_right)) return ZIndices.right_cover_arm;
				return ZIndices.armsidle;
			},
			showfn(options) {
				return options.arm_right !== "none";
			},
			srcfn(options) {
				if (options.mannequin) return `img/body/mannequin/right-arm-${options.arm_right}.png`;
				if (options.arm_right === "idle") return `img/body/right-arm-idle-${options.body_type}.png`;
				return `img/body/right-arm-${options.arm_right}.png`;
			},
		},
		"tummy_parasite": {
			filters: ["tummy_parasite"],
			animation: "idle",

			srcfn(options) {
				switch (options.tummy_parasite) {
					case "urchin":
						/* Swap to img/body/tummyurchingray for new sprites, make sure to include colour changes to the code */
						return 'img/body/parasites/urchin-tummy.png';
					case "slime":
						return 'img/body/parasites/slime-tummy.png';
					default:
						return "";
				}
			},
			showfn(options) {
				return !!options.tummy_parasite
			},
			zfn(options) {
				if (options.crotch_exposed) return ZIndices.parasite;
				return ZIndices.underParasite;
			},
			dxfn(options) {
				if (options.belly >= 23) return 10;
				if (options.belly >= 22) return 8;
				if (options.belly >= 20) return 6;
				if (options.belly >= 15) return 4;
				if (options.belly >= 8) return 2;
				return 0;
			},
			dyfn(options) {
				if (options.belly >= 24) return 6;
				if (options.belly >= 8) return 4;
				if (options.belly >= 2) return 2;
				return 0;
			},
		},

		/***
		 *    ███████  █████   ██████ ███████
		 *    ██      ██   ██ ██      ██
		 *    █████   ███████ ██      █████
		 *    ██      ██   ██ ██      ██
		 *    ██      ██   ██  ██████ ███████
		 *
		 *
		 */
		"freckles": {
			filters: ["tan"],
			z: ZIndices.freckles,

			srcfn(options) {
				return `img/face/${options.facestyle}/freckles.png`;
			},
			showfn(options) {
				return options.show_face && !!options.freckles;
			},
		},
		"ears": {
			filters: ["tan"],
			z: ZIndices.ears,

			srcfn(options) {
				return `img/face/${options.facestyle}/ears.png`;
			},
			showfn(options) {
				return options.show_face && options.ears_position === "front";
			},
		},
		"eyes": {
			filters: ["tan"],
			z: ZIndices.eyes,

			srcfn(options) {
				return `img/face/${options.facestyle}/${options.facevariant}/eyes.png`;
			},
			showfn(options) {
				return options.show_face;
			},
		},
		"sclera": {
			z: ZIndices.sclera,

			srcfn(options) {
				return `img/face/${options.facestyle}/${options.facevariant}/${options.eyes_bloodshot ? "sclera-bloodshot" : "sclera"}.png`;
			},
			showfn(options) {
				return options.show_face;
			},
		},
		"left_iris": {
			filters: ["left_eye"],
			z: ZIndices.iris,
			animation: "idle",

			srcfn(options) {
				const iris = options.trauma ? "iris-empty" : "iris";
				const half = options.eyes_half ? "-half-closed" : "";
				return `img/face/${options.facestyle}/${options.facevariant}/${iris}${half}.png`;
			},
			showfn(options) {
				return options.show_face;
			},
			masksrcfn(options) {
				return "img/face/masks/left.png"
			}
		},
		"right_iris": {
			filters: ["right_eye"],
			z: ZIndices.iris,
			animation: "idle",

			srcfn(options) {
				const iris = options.trauma ? "iris-empty" : "iris";
				const half = options.eyes_half ? "-half-closed" : "";
				return `img/face/${options.facestyle}/${options.facevariant}/${iris}${half}.png`;
			},
			showfn(options) {
				return options.show_face;
			},
			masksrcfn(options) {
				return "img/face/masks/right.png"
			}
		},
		"eyelids": {
			show: true,
			filters: ["tan"],
			z: ZIndices.eyelids,

			srcfn(options) {
				const half = options.eyes_half ? "-half-closed" : "";
				return `img/face/${options.facestyle}/${options.facevariant}/eyelids${half}.png`;
			},
			animationfn(options) {
				return options.blink_animation;
			},
		},
		"lashes": {
			filters: ["tan"],
			z: ZIndices.lashes,

			srcfn(options) {
				const half = options.eyes_half ? "-half-closed" : "";
				return `img/face/${options.facestyle}/${options.facevariant}/lashes${half}.png`;
			},
			showfn(options) {
				return options.show_face;
			},
			animationfn(options) {
				return options.blink_animation;
			},
		},
		"makeup_eyeshadow": {
			filters: ["eyeshadow"],
			z: ZIndices.eyelids,

			brightnessfn(options) {
				makeupAdjustment(options);
				return options.makeup_adjustment;
			},

			srcfn(options) {
				const half = options.eyes_half ? "-half-closed" : "";
				return `img/face/${options.facestyle}/${options.facevariant}/makeup/eyeshadow${half}.png`;
			},
			animationfn(options) {
				return options.blink_animation;
			},
			showfn(options) {
				return options.show_face && !!options.eyeshadow_colour;
			},
		},
		"makeup_mascara": {
			filters: ["mascara"],
			z: ZIndices.lashes,

			srcfn(options) {
				const half = options.eyes_half ? "-half-closed" : "";
				return `img/face/${options.facestyle}/${options.facevariant}/makeup/mascara${half}.png`;
			},
			animationfn(options) {
				return options.blink_animation;
			},
			showfn(options) {
				return options.show_face && !!options.mascara_colour;
			},
		},
		"makeup_blusher": {
			filters: ["tan"],
			z: ZIndices.blush + 1,

			srcfn(options) {
				return `img/face/${options.facestyle}/blusher.png`;
			},
			showfn(options) {
				return options.show_face && !!options.blusher_colour;
			},
		},
		"brows": {
			filters: ["brows"],
			z: ZIndices.brow,

			srcfn(options) {
				return `img/face/${options.facestyle}/${options.facevariant}/brow-${options.brows}.png`;
			},
			zfn(options) {
				return options.brows_position === "back" ? ZIndices.back_brow : ZIndices.brow;
			},
			showfn(options) {
				return options.show_face && options.brows !== "none";
			},
		},
		"mouth": {
			filters: ["tan"],
			z: ZIndices.mouth,

			srcfn(options) {
				return `img/face/${options.facestyle}/mouth-${options.mouth}.png`;
			},
			showfn(options) {
				return options.show_face && options.mouth !== "none";
			},
		},
		"makeup_lipstick": {
			filters: ["lipstick"],
			z: ZIndices.mouth,

			brightnessfn(options) {
				makeupAdjustment(options);
				return options.makeup_adjustment;
			},

			srcfn(options) {
				return `img/face/${options.facestyle}/lipstick-${options.mouth}.png`;
			},
			showfn(options) {
				return options.show_face && !!options.lipstick_colour;
			},
		},
		"blush": {
			filters: ["tan"],
			z: ZIndices.blush,

			srcfn(options) {
				return `img/face/${options.facestyle}/blush-${options.blush}.png`;
			},
			showfn(options) {
				return options.show_face && options.blush > 0;
			},
		},
		"tears": {
			z: ZIndices.tears,
			animation: "idle",

			srcfn(options) {
				return `img/face/${options.facestyle}/tears-${options.tears}.png`;
			},
			showfn(options) {
				return options.show_face && options.tears > 0;
			},
		},
		"makeup_mascara_tears": {
			filters: ["mascara"],
			z: ZIndices.mascara_running,

			srcfn(options) {
				return `img/face/${options.facestyle}/${options.facevariant}/makeup/mascara${options.mascara_running}.png`;
			},
			showfn(options) {
				return options.show_face && options.mascara_running > 0 && !!options.mascara_colour;
			},
		},
		"toast": {
			filters: ["toast"],
			z: ZIndices.toast,

			srcfn() {
				return `img/clothes/props/food/toast-${V.trauma > 4000 ? "raw" : "buttered"}.png`;
			},
			showfn(options) {
				return options.show_face && !!options.toast;
			},
		},
		"scars": {
			z: ZIndices.neck,

			srcfn() {
				return 'img/body/scars-wraith.png';
			},
			showfn(options) {
				return options.show_face && options.scars;
			},
		},
		/***
		 *    ██   ██  █████  ██ ██████
		 *    ██   ██ ██   ██ ██ ██   ██
		 *    ███████ ███████ ██ ██████
		 *    ██   ██ ██   ██ ██ ██   ██
		 *    ██   ██ ██   ██ ██ ██   ██
		 *
		 *
		 */
		"hair_sides": {
			filters: ["hair"],
			animation: "idle",

			srcfn(options) {
				return `img/hair/sides/${options.hair_sides_type}/${options.hair_sides_length}.png`;
			},
			zfn(options) {
				return options.hair_sides_position === "front" ? ZIndices.hair_forward : ZIndices.backhair;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
				return `img/clothes/over-upper/kaiju/mask.png`;
				return options.headMask;
			},
			showfn(options) {
				return !!options.show_hair && !!options.hair_sides_type;
			},
		},
		"hair_fringe": {
			filters: ["hair_fringe"],
			z: ZIndices.front_hair,
			animation: "idle",

			srcfn(options) {
				return `img/hair/fringe/${options.hair_fringe_type}/${options.hair_fringe_length}.png`;
			},
			showfn(options) {
				return !!options.show_hair && !!options.hair_fringe_type;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
				return `img/clothes/over-upper/kaiju/mask.png`;
				return options.headMask.length ? options.headMask : options.fringe_mask_src;
			},
		},
		"hair_extra": { // Extra layer for thighs+ long hair for certain styles
			filters: ["hair"],
			z: ZIndices.backhair,
			animation: "idle",

			srcfn(options) {
				const hairs = [
					"default",
					"loose",
					"curl",
					"defined curl",
					"neat",
					"dreads",
					"afro pouf",
					"thick ponytail",
					"all down",
					"half-up",
					"messy ponytail",
					"ruffled",
					"half up twintail",
					"princess wave",
					"space buns",
					"sleek",
					"bedhead",
				];

				const path = `img/hair/back/${options.hair_sides_type}`;
				if (options.hair_sides_length === "feet" && [...hairs, "straight"].includes(options.hair_sides_type))
					return `${path}/feet.png`;
				if (options.hair_sides_length === "thighs" && hairs.includes(options.hair_sides_type))
					return `${path}/thighs.png`;
				if (options.hair_sides_length === "navel" && options.hair_sides_type === "messy ponytail")
					return `${path}/navel.png`;
				return "";
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
				return `img/clothes/over-upper/kaiju/mask.png`;
				return options.headMask;
			},
			showfn(options) {
				return !!options.show_hair && !!options.hair_sides_type;
			},
		},
		/***
		 *     ██████ ██████   ██████  ████████  ██████ ██   ██
		 *    ██      ██   ██ ██    ██    ██    ██      ██   ██
		 *    ██      ██████  ██    ██    ██    ██      ███████
		 *    ██      ██   ██ ██    ██    ██    ██      ██   ██
		 *     ██████ ██   ██  ██████     ██     ██████ ██   ██
		 *
		 *
		 */
		"pbhair": {
			filters: ["pbhair"],
			z: ZIndices.pbhair,
			animation: "idle",

			srcfn(options) {
				return `img/hair/phair/pb${options.pbhair_level}.png`;
			},
			showfn(options) {
				// $pblevel 4 does not exist
				return options.crotch_visible
					&& options.pbhair_level > 1
					&& !options.belly_hides_under_lower
					&& options.pbhair_level !== 4;
			},
			masksrcfn(options) {
				return options.body_type === "soft" ? "img/clothes/masks/soft-lower-clip.png" : null;
			}
		},
		"pbhair_strip": {
			filters: ["pbhair"],
			z: ZIndices.pbhair,
			animation: "idle",

			srcfn(options) {
				return `img/hair/phair/pbstrip${options.pbhair_strip}.png`;
			},
			showfn(options) {
				return options.crotch_visible
					&& options.pbhair_strip >= 1
					&& !options.belly_hides_under_lower;
			},
			masksrcfn(options) {
				return options.body_type === "soft" ? "img/clothes/masks/soft-lower-clip.png" : null;
			}
		},
		"pbhair_balls": {
			filters: ["pbhair"],
			animation: "idle",

			zfn(options) {
				return options.crotch_exposed ? ZIndices.pbhairballs : ZIndices.pbhairballsunderclothes;
			},
			srcfn(options) {
				return `img/hair/phair/balls/${options.penis_size}-pb${options.pbhair_balls}.png`;
			},
			showfn(options) {
				return options.crotch_visible
					&& options.pbhair_balls > 1
					&& options.balls
					&& !options.genitals_chastity;
			},
		},
		"penis": {
			filters: ["tan"],
			animation: "idle",

			zfn(options) {
				if (!options.crotch_exposed) return ZIndices.penisunderclothes
				return (options.genitals_chastity) ? ZIndices.penis_chastity : ZIndices.penis
			},
			srcfn(options) {
				if (options.mannequin) return "img/body/mannequin/penis.png";
				if (options.genitals_chastity) return "img/body/penis/chastity.png";
				const penis = options.balls ? "penis" : "penis-no-balls";
				return `img/body/${penis}/${options.penis}.png`;
			},
			showfn(options) {
				return options.crotch_visible && !!options.penis && !playerHasStrapon() && !(options.ear_slime_panties && V.arousal < 6000);
			},
		},
		"penis_parasite": {
			animation: "idle",
			filtersfn(options) {
				if (options.ear_slime_panties) return ["ear_slime"];
				return [];
			},
			srcfn(options) {
				if (!options.penis_parasite.includes("ear-slime")) return `img/body/parasites/${options.penis_parasite}.png`;
				const folder = options.balls ? "penis" : "penis-no-balls";
				return `img/body/${folder}/${options.penis_parasite}.png`;
			},
			showfn(options) {
				return options.crotch_visible && !!options.penis && !!options.penis_parasite && !playerHasStrapon();
			},
			zfn(options) {
				if (options.genitals_chastity) return options.crotch_exposed ? ZIndices.penis_chastity : ZIndices.penisunderclothes;
				if (options.crotch_exposed) return ZIndices.parasite;
				return ZIndices.underParasite;
			},
		},
		"clit_parasite": {
			animation: "idle",

			srcfn(options) {
				return `img/body/${options.clit_parasite}.png`;
			},
			showfn(options) {
				return options.crotch_visible && !!options.clit_parasite && !options.chastity && !options.belly_hides_under_lower
			},
			zfn(options) {
				if (options.crotch_exposed) return ZIndices.parasite;
				return ZIndices.underParasite;
			},
		},
		"ear_slime_panties": {
			filters: ["ear_slime"],
			animation: "idle",

			srcfn(options) {
				return `img/body/${options.ear_slime_panties}.png`;
			},
			showfn(options) {
				return !!options.ear_slime_panties && !options.belly_hides_under_lower;
			},
			zfn(options) {
				return options.crotch_exposed ? ZIndices.penis_chastity - 0.1 : ZIndices.penisunderclothes - 0.1;
			},
		},
		"penis_condom": {
			alpha: 0.4,
			animation: "idle",
			filters: ["condom"],

			srcfn(options) {
				return options.penis_condom === 'plain' ? `img/body/penis/condom-${options.penis.replace("-virgin", "")}.png` : '';
			},
			showfn(options) {
				return options.crotch_visible
					&& !!options.penis
					&& !!options.penis_condom
					&& !options.genitals_chastity;
			},
			zfn(options) {
				return options.crotch_exposed ? ZIndices.parasite : ZIndices.underParasite;
			},
		},
		/***
		 *    ████████ ███████ ███████
		 *       ██    ██      ██
		 *       ██    █████   ███████
		 *       ██    ██           ██
		 *       ██    ██      ███████
		 *
		 *
		 */

		/***
		 *    ██     ██  ██████  ██      ███████
		 *    ██     ██ ██    ██ ██      ██
		 *    ██  █  ██ ██    ██ ██      █████
		 *    ██ ███ ██ ██    ██ ██      ██
		 *     ███ ███   ██████  ███████ ██
		 *
		 *
		 */
		"wolf_tail": genlayer_tail("wolf", true),
		"wolf_ears": genlayer_ears("wolf", true),
		"wolf_cheeks": genlayer_cheeks("wolf"),
		"wolf_pits": genlayer_tf_pits("wolf", "hirsute"),
		"wolf_pubes": genlayer_tf_pubes("wolf", "hirsute"),
		/***
		 *     ██████  █████  ████████
		 *    ██      ██   ██    ██
		 *    ██      ███████    ██
		 *    ██      ██   ██    ██
		 *     ██████ ██   ██    ██
		 *
		 *
		 */

		"cat_tail": genlayer_tail("cat", true),
		"cat_ears": genlayer_ears("cat", true),

		/***
		 *     ██████  ██████  ██     ██
		 *    ██      ██    ██ ██     ██
		 *    ██      ██    ██ ██  █  ██
		 *    ██      ██    ██ ██ ███ ██
		 *     ██████  ██████   ███ ███
		 *
		 *
		 */
		"cow_horns": genlayer_horns("cow", {
			zfn(options) {
				return options.cow_horns_layer === "front" ? ZIndices.over_head + 1 : ZIndices.horns + 1;
			},
		}),
		"cow_ear_left": genlayer_ears("cow", false, {
			z: ZIndices.horns,
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return "img/face/masks/left.png"
			}
		}),
		"cow_ear_right": genlayer_ears("cow", false, {
			zfn() {
				return ZIndices.ears + 0.5;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return "img/face/masks/right.png"
			}
		}),
		"cow_tag": genlayer_ears("cow", false, {
			z: ZIndices.facewear,
			src: `img/transformations/cow/ears/tag.png`,
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			}
		}),
		"cow_tail": genlayer_tail("cow", false),

		/***
		 *    ██████  ██ ██████  ██████
		 *    ██   ██ ██ ██   ██ ██   ██
		 *    ██████  ██ ██████  ██   ██
		 *    ██   ██ ██ ██   ██ ██   ██
		 *    ██████  ██ ██   ██ ██████
		 *
		 *
		 */

		"bird_wings_right": genlayer_wings("right", "bird", true),
		"bird_wings_left": genlayer_wings("left", "bird", true),
		"bird_wings_loose": {
			filters: ["hair"],
			animation: "looseFeathers",
			z: ZIndices.tailPenisCover,
			src: `img/transformations/bird/feathers/loose.png`,
			showfn(options) {
				return options.show_tf && isPartEnabled(options.bird_wings_type) && !options.hide_all && T.selfFeatherNum > 0;
			},
		},
		"bird_tail": genlayer_tail("bird", true),
		"bird_eyes": {
			z: ZIndices.irisacc,
			animation: "idle",

			srcfn(options) {
				return `img/transformations/bird/eyes/${options.bird_eyes_type}.png`;
			},
			showfn(options) {
				return options.show_tf
					&& options.show_face
					&& isPartEnabled(options.bird_eyes_type)
					&& !options.hide_all;
			},
			masksrcfn(options) {
				return {
					path: `img/face/${options.facestyle}/${options.facevariant}/iris.png`,
					convert: true,
				};
			}
		},
		"bird_malar": genlayer_tf("bird", "feathers", "malar"),
		"bird_plumage": genlayer_tf("bird", "feathers", "plumage"),
		"bird_pubes": genlayer_tf_pubes("bird", "feathers"),
		/***
		 *    ███████  ██████  ██   ██
		 *    ██      ██    ██  ██ ██
		 *    █████   ██    ██   ███
		 *    ██      ██    ██  ██ ██
		 *    ██       ██████  ██   ██
		 *
		 *
		 */
		"fox_tail": genlayer_tail("fox", true),
		"fox_ears": genlayer_ears("fox", true),
		"fox_cheeks": genlayer_cheeks("fox"),

		/***
		 *     █████  ███    ██  ██████  ███████ ██
		 *    ██   ██ ████   ██ ██       ██      ██
		 *    ███████ ██ ██  ██ ██   ███ █████   ██
		 *    ██   ██ ██  ██ ██ ██    ██ ██      ██
		 *    ██   ██ ██   ████  ██████  ███████ ███████
		 *
		 *
		 */
		"angel_wings_right": genlayer_wings("right", "angel", false),
		"angel_wings_left": genlayer_wings("left", "angel", false),
		"angel_halo_back": genlayer_halo("back", "angel"),
		"angel_halo_front": genlayer_halo("front", "angel"),
		/***
		 *    ███████  █████  ██      ██      ███████ ███    ██
		 *    ██      ██   ██ ██      ██      ██      ████   ██
		 *    █████   ███████ ██      ██      █████   ██ ██  ██
		 *    ██      ██   ██ ██      ██      ██      ██  ██ ██
		 *    ██      ██   ██ ███████ ███████ ███████ ██   ████
		 *
		 *
		 */
		"fallen_wings_right": genlayer_wings("right", "fallen", false),
		"fallen_wings_left": genlayer_wings("left", "fallen", false),
		"fallen_halo_back": genlayer_halo("back", "fallen"),
		"fallen_halo_front": genlayer_halo("front", "fallen"),

		/***
		 *    ██████  ███████ ███    ███  ██████  ███    ██
		 *    ██   ██ ██      ████  ████ ██    ██ ████   ██
		 *    ██   ██ █████   ██ ████ ██ ██    ██ ██ ██  ██
		 *    ██   ██ ██      ██  ██  ██ ██    ██ ██  ██ ██
		 *    ██████  ███████ ██      ██  ██████  ██   ████
		 *
		 *
		 */
		"demon_wings": {
			filters: ["demon_wings"],
			animation: "idle",

			srcfn(options) {
				return `img/transformations/demon/wings-${options.demon_wings_state}/${options.demon_wings_type}.png`;
			},
			showfn(options) {
				return options.show_tf
					&& isPartEnabled(options.demon_wings_type)
					&& !isPartEnabled(options.bird_wings_type)
					&& !options.hide_all;
			},
			zfn(options) {
				if (["cover", "flaunt"].includes(options.demon_wings_state)) return ZIndices.tailPenisCover
				if (options.demon_wings_layer === "back") return ZIndices.head_back;
				return ZIndices.backhair
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"demon_tail": genlayer_tail("demon", false, {
			filters: ["demon_tail"],
		}),
		"demon_horns": genlayer_horns("demon", {
			filters: ["demon_horns"],
		}),

		/***
		 *    ██     ██ ██████  ██ ████████ ██ ███    ██  ██████  ███████
		 *    ██     ██ ██   ██ ██    ██    ██ ████   ██ ██       ██
		 *    ██  █  ██ ██████  ██    ██    ██ ██ ██  ██ ██   ███ ███████
		 *    ██ ███ ██ ██   ██ ██    ██    ██ ██  ██ ██ ██    ██      ██
		 *     ███ ███  ██   ██ ██    ██    ██ ██   ████  ██████  ███████
		 *
		 *
		 */
		"writing_forehead": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				return getWritingImgPath('forehead', setup.bodywriting[options.writing_forehead]);
			},
			showfn(options) {
				return options.show_writings && !!options.writing_forehead;
			},
		},
		"writing_left_cheek": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				return getWritingImgPath('left_cheek', setup.bodywriting[options.writing_left_cheek]);
			},
			showfn(options) {
				return options.show_writings && !!options.writing_left_cheek;
			},
		},
		"writing_right_cheek": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				return getWritingImgPath('right_cheek', setup.bodywriting[options.writing_right_cheek]);
			},
			showfn(options) {
				return options.show_writings && !!options.writing_right_cheek;
			},
		},
		"writing_breasts": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				const area_name = "breasts"
				const writing = setup.bodywriting[options.writing_breasts];
				if (writing.type === "text") {
					if (writing.sprites && writing.sprites.length > 0 && writing.sprites.includes(area_name)) {
						return `img/bodywriting/text/${writing.key.replace(/_/g,"-")}/${area_name.replace(/_/g,"-")}.png`;
					}
					return `img/bodywriting/text/default/${area_name.replace(/_/g,"-")}-1.png`;
				}
				if (writing.type === "object") {
					return `img/bodywriting/${writing.writing}/${area_name.replace(/_/g,"-")}-${options.breast_size}.png`;
				}
				return '';
			},
			showfn(options) {
				return options.show_writings && !!options.writing_breasts;
			},
		},
		"writing_breasts_extra": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				const writing = setup.bodywriting[options.writing_breasts];
				if ((!writing.sprites || writing.sprites.length == 0)
					&& writing.type === "text" && options.breast_size >= 2) {
					return `img/bodywriting/text/default/breasts-${options.breast_size}.png`;
				}
				return '';
			},
			showfn(options) {
				return options.show_writings && !!options.writing_breasts;
			},
		},
		"writing_left_shoulder": {
			animation: "idle",

			srcfn(options) {
				return getWritingImgPath('left_shoulder', setup.bodywriting[options.writing_left_shoulder]);
			},
			showfn(options) {
				return options.show_writings && !!options.writing_left_shoulder;
			},
			zfn(options) {
				if (["cover", "hold"].includes(options.arm_left)) return ZIndices.left_cover_arm + 0.5;
				return ZIndices.breasts + 0.5;
			},
		},
		"writing_right_shoulder": {
			animation: "idle",

			srcfn(options) {
				return getWritingImgPath('right_shoulder', setup.bodywriting[options.writing_right_shoulder]);
			},
			showfn(options) {
				return options.show_writings && !!options.writing_right_shoulder;
			},
			dxfn(options) {
				if (["none", "cover"].includes(options.arm_right)) return 4;
				return 0;
			},
			zfn(options) {
				if (["cover", "hold"].includes(options.arm_right)) return ZIndices.right_cover_arm + 0.5;
				return ZIndices.armsidle + 0.5;
			},
		},
		"writing_pubic": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				return getWritingImgPathArrow('pubic', setup.bodywriting[options.writing_pubic]);
			},
			showfn(options) {
				return options.show_writings && !!options.writing_pubic;
			},
			dxfn(options) {
				if (options.belly >= 23) return 10;
				if (options.belly >= 22) return 8;
				if (options.belly >= 20) return 6;
				if (options.belly >= 17) return 4;
				if (options.belly >= 8) return 2;
				return 0;
			},
			dyfn(options) {
				if (options.belly >= 24) return 6;
				if (options.belly >= 22) return 4;
				if (options.belly >= 21) return 2;
				return 0;
			},
		},
		"writing_left_thigh": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				return getWritingImgPathArrow('left_thigh', setup.bodywriting[options.writing_left_thigh]);
			},
			showfn(options) {
				return options.show_writings && !!options.writing_left_thigh;
			},
		},
		"writing_right_thigh": {
			z: ZIndices.skin,
			animation: "idle",

			srcfn(options) {
				return getWritingImgPathArrow('right_thigh', setup.bodywriting[options.writing_right_thigh]);
			},
			showfn(options) {
				return !!options.writing_right_thigh;
			},
		},

		/***
		 *    ██████  ██████  ██ ██████  ███████
		 *    ██   ██ ██   ██ ██ ██   ██ ██
		 *    ██   ██ ██████  ██ ██████  ███████
		 *    ██   ██ ██   ██ ██ ██           ██
		 *    ██████  ██   ██ ██ ██      ███████
		 *
		 *
		 */

		"drip_vaginal": {
			z: ZIndices.tears,

			srcfn(options) {
				const output = options.drip_vaginal;
				return `img/body/cum/vaginal-${output}.png`;
			},
			showfn(options) {
				return !!options.drip_vaginal;
			},
			animationfn(options) {
				let anim = options.drip_vaginal;
				if (anim.includes("-")) {
					anim = toTitleCase(anim.split("-")[0]) + toTitleCase(anim.split("-")[1]);
				} else {
					anim = toTitleCase(anim);
				}
				return `VaginalCumDrip${anim}`;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"drip_anal": {
			z: ZIndices.tears,

			srcfn(options) {
				const output = options.drip_anal;
				return `img/body/cum/anal-${output}.png`;
			},
			showfn(options) {
				return !!options.drip_anal;
			},
			animationfn(options) {
				let anim = options.drip_anal;
				if (anim.includes("-")) {
					anim = toTitleCase(anim.split("-")[0]) + toTitleCase(anim.split("-")[1]);
				} else {
					anim = toTitleCase(anim);
				}
				return `AnalCumDrip${anim}`;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"drip_mouth": {
			z: ZIndices.semen_cough,

			srcfn(options) {
				const output = options.drip_mouth;
				return `img/body/cum/mouth-${output}.png`;
			},
			showfn(options) {
				return options.show_face
					&& !!options.drip_mouth
					&& !options.worn.face.setup.type.includesAny("mask", "face_covering");
			},
			dxfn(options) {
				return options.facestyle === "small-eyes" ? 2 : 0;
			},
			animationfn(options) {
				let anim = options.drip_mouth;
				if (anim.includes("-")) {
					anim = toTitleCase(anim.split("-")[0]) + toTitleCase(anim.split("-")[1]);
				} else {
					anim = toTitleCase(anim);
				}
				return `MouthCumDrip${anim}`;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_chest": {
			z: ZIndices.tears,
			animation: "idle",

			srcfn(options) {
				return `img/body/cum/chest-${options.cum_chest}.png`;
			},
			showfn(options) {
				return !!options.cum_chest;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_face": {
			z: ZIndices.tears,
			animation: "idle",

			srcfn(options) {
				return `img/body/cum/face-${options.cum_face}.png`;
			},
			showfn(options) {
				return options.show_face && !!options.cum_face;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_feet": {
			z: ZIndices.tears,
			animation: "idle",

			srcfn(options) {
				return `img/body/cum/feet-${options.cum_feet}.png`;
			},
			showfn(options) {
				return !!options.cum_feet;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_leftarm": {
			animation: "idle",
			srcfn(options) {
				return `img/body/cum/left-arm-${options.cum_leftarm}.png`;
			},
			showfn(options) {
				return options.arm_left !== "none" && options.arm_left != "cover" && !!options.cum_leftarm;
			},
			zfn(options) {
				return (options.arm_right === "cover") ? ZIndices.arms_cover + 0.05 : options.zarms + 0.05;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_rightarm": {
			animation: "idle",

			srcfn(options) {
				return `img/body/cum/right-arm-${options.cum_rightarm}.png`;
			},
			showfn(options) {
				return options.arm_right !== "none"
					&& options.arm_right != "cover"
					&& options.arm_right != "hold"
					&& !!options.cum_rightarm;
			},
			zfn(options) {
				return (options.arm_right === "cover" || options.arm_right === "hold") ? ZIndices.arms_cover + 0.05 : options.zarms + 0.05;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_neck": {
			z: ZIndices.tears,
			animation: "idle",

			srcfn(options) {
				return `img/body/cum/neck-${options.cum_neck}.png`;
			},
			showfn(options) {
				return !!options.cum_neck;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_thigh": {
			z: ZIndices.tears,
			animation: "idle",

			srcfn(options) {
				return `img/body/cum/thighs-${options.cum_thigh}.png`;
			},
			showfn(options) {
				return !!options.cum_thigh;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},
		"cum_tummy": {
			z: ZIndices.tears,
			animation: "idle",

			srcfn(options) {
				return `img/body/cum/tummy-${options.cum_tummy}.png`;
			},
			showfn(options) {
				return !!options.cum_tummy;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
		},

		/***
		 *     ██████ ██       ██████  ████████ ██   ██ ███████ ███████
		 *    ██      ██      ██    ██    ██    ██   ██ ██      ██
		 *    ██      ██      ██    ██    ██    ███████ █████   ███████
		 *    ██      ██      ██    ██    ██    ██   ██ ██           ██
		 *     ██████ ███████  ██████     ██    ██   ██ ███████ ███████
		 *
		 *
		 */
		/***
		 *    ██    ██ ██████  ██████  ███████ ██████
		 *    ██    ██ ██   ██ ██   ██ ██      ██   ██
		 *    ██    ██ ██████  ██████  █████   ██████
		 *    ██    ██ ██      ██      ██      ██   ██
		 *     ██████  ██      ██      ███████ ██   ██
		 *
		 *
		 */
		"upper_main": genlayer_clothing_main('upper', {
			zfn(options) {
				return options.worn.upper.setup.name === "cocoon" ? ZIndices.old_over_upper : options.zupper;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.upperMask;
			},
		}),
		"upper_detail": genlayer_clothing_detail('upper', {
			zfn(options) {
				return options.zupper;
			},
		}),
		"upper_fitted_left": genlayer_clothing_fitted_left("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.upper_fitted_left_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? 2 : -2;
			},
		}),
		"upper_fitted_right": genlayer_clothing_fitted_right("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.upper_fitted_right_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? -2 : 2;
			},
		}),
		"upper_belly_split_shadow": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper - 1;
			},
			masksrcfn(options) {
				return options.shirt_mask_clip_src;
			},
			dyfn(options) {
				return options.shirt_move_left_src ? 2 : 0;
			},
			dxfn() {
				return 0;
			},
			brightnessfn(options) {
				return options.shirt_move_left_src && options.shirt_mask_clip_src ? -0.3 : 0;
			},
		}),
		"upper_belly_split_l": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_left_src;
			},
			dxfn(options) {
				if (options.shirt_move_left_src)
					return options.belly >= 22 ? 12 : 8;
				return 0;
			},
			dyfn(options) {
				return options.shirt_move_left_src ? -2 : 0;
			},
		}),
		"upper_belly_split_l2": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_left2_src;
			},
			dxfn(options) {
				if (options.shirt_move_left2_src)
					return options.belly >= 22 ? 14 : 10;
				return 0;
			},
			dyfn() {
				return 0;
			},
		}),
		"upper_belly_split_l_shadow": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper - 1;
			},
			masksrcfn(options) {
				return options.shirt_move_left_src
			},
			dxfn(options) {
				if (options.shirt_move_left_src)
					return options.belly >= 22 ? 14 : 10;
				return 0;
			},
			dyfn(options) {
				return options.shirt_move_left_src ? -2 : 0;
			},
			brightnessfn(options) {
				return options.shirt_move_left_src ? -0.3 : 0;
			},
		}),
		"upper_belly_split_l2_shadow": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper - 1;
			},
			masksrcfn(options) {
				return options.shirt_move_left2_src;
			},
			dxfn(options) {
				if (options.shirt_move_left2_src)
					return options.belly >= 22 ? 16 : 12;
				return 0;
			},
			dyfn() {
				return 0;
			},
			brightnessfn(options) {
				return options.shirt_move_left2_src ? -0.3 : 0;
			},
		}),
		"upper_belly_split_r": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_right_src;
			},
		}),
		"upper_belly_split_r2": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_right2_src;
			},
			dxfn(options) {
				if (options.shirt_move_right2_src) return -4;
			},
		}),
		"upper_belly_split_r3": genlayer_clothing_belly_split("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_right3_src;
			},
			dxfn(options) {
				if (options.shirt_move_right3_src) return -6;
			},
		}),
		"upper_belly_2": genlayer_clothing_belly_2("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.belly_mask_src;
			},
		}),
		"upper_belly": genlayer_clothing_belly("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.belly_mask_src;
			},
		}),
		"upper_belly_acc": genlayer_clothing_belly_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.belly_mask_src;
			},
		}),
		"upper_belly_split_acc_shadow": genlayer_clothing_belly_split_acc("upper", {
			zfn(options) {
				return options.zupper - 1;
			},
			masksrcfn(options) {
				return options.shirt_mask_clip_src;
			},
			dyfn(options) {
				return options.shirt_move_left_src ? 2 : 0;
			},
			dxfn() {
				return 0;
			},
			brightnessfn(options) {
				return options.shirt_move_left_src && options.shirt_mask_clip_src ? -0.3 : 0;
			},
		}),
		"upper_belly_split_acc_l": genlayer_clothing_belly_split_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_left_src;
			},
			dxfn(options) {
				if (options.shirt_move_left_src) return options.belly >= 22 ? 12 : 10;
				return 0;
			},
			dyfn(options) {
				return options.shirt_move_left_src ? -4 : 0;
			},
		}),
		"upper_belly_split_acc_l2": genlayer_clothing_belly_split_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_left2_src;
			},
			dxfn(options) {
				if (options.shirt_move_left2_src) return options.belly >= 22 ? 14 : 12;
				return 0;
			},
			dyfn(options) {
				return options.shirt_move_left2_src ? -2 : 0;
			},
		}),
		"upper_belly_split_acc_r": genlayer_clothing_belly_split_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_right_src;
			},
		}),
		"upper_belly_split_acc_r2": genlayer_clothing_belly_split_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_right2_src;
			},
			dxfn(options) {
				if (options.shirt_move_right2_src) return -4;
			},
		}),
		"upper_belly_split_acc_r3": genlayer_clothing_belly_split_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				return options.shirt_move_right3_src;
			},
			dxfn(options) {
				if (options.shirt_move_right3_src) return -6;
			},
		}),
		"upper_fitted_left_acc": genlayer_clothing_fitted_left_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.upper_fitted_left_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? 2 : -2;
			},
		}),
		"upper_fitted_right_acc": genlayer_clothing_fitted_right_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.upper_fitted_right_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? -2 : 2;
			},
		}),
		"upper_breasts": genlayer_clothing_breasts("upper", {
			zfn(options) {
				return options.acc_layer_under ? ZIndices.upper + 1 : options.zupper;
			},
		}),
		"upper_acc": genlayer_clothing_accessory("upper", {
			zfn(options) {
				return options.arm_right === "hold" && options.sleeve_over_hold ? ZIndices.lower_high : options.zupper;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.upperMask;
			},
		}),
		"upper_breasts_acc": genlayer_clothing_breasts_acc("upper", {
			zfn(options) {
				return options.zupper;
			},
		}),
		"upper_breasts_detail": genlayer_clothing_breasts_detail("upper", {
			zfn(options) {
				return options.zupper;
			},
		}),
		"upper_rightarm": genlayer_clothing_arm("right", "upper", {
			zfn(options) {
				return options.zupperright;
			},
		}),
		"upper_leftarm": genlayer_clothing_arm("left", "upper", {
			zfn(options) {
				return options.zupperleft;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.belly_hides_lower ? options.belly_mask_clip_src : null;
			},
		}),
		"upper_leftarm_fitted": genlayer_clothing_arm_fitted("left", "upper", {
			zfn(options) {
				return options.zupperleft - 1;
			},
		}),
		"upper_leftarm_fitted_acc": genlayer_clothing_arm_acc_fitted("left", "upper", {
			zfn(options) {
				return options.zupperleft - 1;
			},
		}),
		"upper_rightarm_acc": genlayer_clothing_arm_acc("right", "upper", {
			zfn(options) {
				return options.zupperright;
			},
		}),
		"upper_leftarm_acc": genlayer_clothing_arm_acc("left", "upper", {
			zfn(options) {
				return options.zupperleft;
			},
		}),
		"upper_back": genlayer_clothing_back_img('upper', {
			z: ZIndices.back_lower
		}),

		/***
		 *     ██████  ██    ██ ███████ ██████  ██    ██ ██████  ██████  ███████ ██████
		 *    ██    ██ ██    ██ ██      ██   ██ ██    ██ ██   ██ ██   ██ ██      ██   ██
		 *    ██    ██ ██    ██ █████   ██████  ██    ██ ██████  ██████  █████   ██████
		 *    ██    ██  ██  ██  ██      ██   ██ ██    ██ ██      ██      ██      ██   ██
		 *     ██████    ████   ███████ ██   ██  ██████  ██      ██      ███████ ██   ██
		 *
		 *
		 */
		"over_upper_main": genlayer_clothing_main('over_upper'),
		"over_upper_breasts": genlayer_clothing_breasts("over_upper"),
		"over_upper_acc": genlayer_clothing_accessory('over_upper'),
		"over_upper_detail": genlayer_clothing_detail('over_upper'),
		"over_upper_rightarm": genlayer_clothing_arm("right", "over_upper", {
			zfn(options) {
				return (options.arm_right === "cover" || options.arm_right === "hold") ?
					ZIndices.over_upper_arms + 0.9 : ZIndices.over_upper_arms;
			},
		}),
		"over_upper_leftarm": genlayer_clothing_arm("left", "over_upper", {
			zfn(options) {
				return options.arm_left === "cover" ?
					ZIndices.over_upper_arms + 0.9 : ZIndices.over_upper_arms;
			},
		}),
		"over_upper_back": genlayer_clothing_back_img('over_upper', {
			z: ZIndices.back_lower - 10
		}),
		/***
		 *     ██████  ███████ ███    ██ ██ ████████  █████  ██      ███████
		 *    ██       ██      ████   ██ ██    ██    ██   ██ ██      ██
		 *    ██   ███ █████   ██ ██  ██ ██    ██    ███████ ██      ███████
		 *    ██    ██ ██      ██  ██ ██ ██    ██    ██   ██ ██           ██
		 *     ██████  ███████ ██   ████ ██    ██    ██   ██ ███████ ███████
		 *
		 *
		 */

		"genitals": genlayer_clothing_main('genitals', {
			zfn(options) {
				return options.crotch_exposed ? ZIndices.penis_chastity + 0.1 : ZIndices.penisunderclothes + 0.1;
			},
			showfn(options) {
				return options.worn.genitals.index > 0
					&& options.worn.genitals.setup.mainImage !== 0
					&& !options.worn.genitals.setup.hideUnderLower.includes(options.worn.under_lower.setup.name)
					&& !options.belly_hides_under_lower;
			},
			srcfn(options) {
				if (options.worn.genitals.setup.name === "chastity parasite") {
					return `img/body/ear-slime-chastity-${options.ear_slime_size}.png`;
				}

				const setupVar = options.worn.genitals.setup.variable;
				const integrity = options.worn.genitals.integrity;
				return `img/clothes/genitals/${setupVar}/${integrity}.png`;
			},
			masksrcfn(options) {
				return options.underLowerMask;
			}
		}),
		"buttplug": {
			z: ZIndices.backhair,
			animation: "idle",
			showfn(options) {
				return playerHasButtPlug() && V.worn.butt_plug.name.includes("tail") && !options.mannequin;
			},
			srcfn() {
				return `img/clothes/back/${V.worn.butt_plug.name}/back.png`;
			},
		},
		/***
		 *    ██       ██████  ██     ██ ███████ ██████
		 *    ██      ██    ██ ██     ██ ██      ██   ██
		 *    ██      ██    ██ ██  █  ██ █████   ██████
		 *    ██      ██    ██ ██ ███ ██ ██      ██   ██
		 *    ███████  ██████   ███ ███  ███████ ██   ██
		 *
		 *
		 */
		"lower": genlayer_clothing_main('lower', {
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				const secondary = options.worn.lower.setup.type.includes("overalls") ? ZIndices.lower_cover : ZIndices.lower;
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : secondary;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.lowerMask;
			},
		}),
		"lower_belly_2": genlayer_clothing_belly_2("lower", {
			masksrcfn(options) {
				return options.lowerBellyMask;
			},
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : ZIndices.lower_belly;
			},
		}),
		"lower_belly": genlayer_clothing_belly("lower", {
			masksrcfn(options) {
				return options.lowerBellyMask;
			},
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : ZIndices.lower_belly;
			},
		}),
		"lower_belly_shadow": genlayer_clothing_belly_shadow("lower", {
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : ZIndices.lower_belly;
			},
		}),
		"lower_belly_acc": genlayer_clothing_belly_acc("lower", {
			masksrcfn(options) {
				return options.lowerBellyMask;
			},
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : ZIndices.lower_belly;
			},
		}),
		"lower_breasts": genlayer_clothing_breasts("lower", {
			zfn(options) {
				return options.acc_layer_under ? ZIndices.lower_high + 1 : ZIndices.lower_high;
			},
		}),
		"lower_fitted_left": genlayer_clothing_fitted_left("lower", {
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				const secondary = options.worn.lower.setup.type.includes("overalls") ? ZIndices.lower_cover : ZIndices.lower;
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : secondary;
			},
			masksrcfn(options) {
				return options.upper_fitted_left_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? 2 : -2;
			},
		}),
		"lower_fitted_right": genlayer_clothing_fitted_right("lower", {
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				const secondary = options.worn.lower.setup.type.includes("overalls") ? ZIndices.lower_cover : ZIndices.lower;
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : secondary;
			},
			masksrcfn(options) {
				return options.upper_fitted_right_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? -2 : 2;
			},
		}),
		"lower_fitted_acc_left": genlayer_clothing_fitted_left_acc("lower", {
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				const secondary = options.worn.lower.setup.type.includes("overalls") ? ZIndices.lower_cover : ZIndices.lower;
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : secondary;
			},
			masksrcfn(options) {
				return options.upper_fitted_left_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? 2 : -2;
			},
		}),
		"lower_fitted_acc_right": genlayer_clothing_fitted_right_acc("lower", {
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				const secondary = options.worn.lower.setup.type.includes("overalls") ? ZIndices.lower_cover : ZIndices.lower;
				return options.worn.lower.setup.high_img ? ZIndices.lower_high : secondary;
			},
			masksrcfn(options) {
				return options.upper_fitted_right_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? -2 : 2;
			},
		}),
		"lower_acc": genlayer_clothing_accessory("lower", {
			srcfn(options) {
				const secondary = options.worn.upper.setup.name === "school blouse" && options.worn.lower.setup.name.includes("pinafore") ? '-under' : '';
				const suffix = options.worn.lower.setup.accessory_integrity_img ? `-${options.worn.lower.integrity}` : secondary;
				const pattern = options.worn.lower.pattern && options.worn.lower.setup.pattern_layer === "secondary" ? "-" + options.worn.lower.pattern?.replace(/ /g,"-") : '';
				return `img/clothes/lower/${options.worn.lower.setup.variable}/acc${suffix}${pattern}.png`;
			},
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				if (options.worn.lower.setup.name.includes("ballgown") || options.worn.lower.setup.name.includes("pinafore"))
					return ZIndices.upper_top;
				if (options.worn.lower.setup.type.includes("overalls")) return ZIndices.lower_cover;
				return ZIndices.lower;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.lowerMask;
			},
		}),
		"lower_detail": genlayer_clothing_detail("lower", {
			zfn(options) {
				const setup = options.worn.lower.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				if (options.worn.lower.setup.type.includes("overalls"))
					return ZIndices.lower_high;
				return ZIndices.lower;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				return options.lowerMask;
			},
		}),
		"lower_breasts_acc": genlayer_clothing_breasts_acc("lower", {
			zfn(options) {
				return options.acc_layer_under ? ZIndices.lower_high + 1 : ZIndices.lower_high;
			},
		}),
		"lower_penis": {
			z: ZIndices.lower_top,
			filters: ["worn_lower"],
			animation: "idle",

			//ToDo: add images for lower penis bulges. check against pregnancy belly
			srcfn(options) {
				return `img/clothes/lower/${options.worn.lower.setup.variable}/penis.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& !options.belly_hides_lower
					&& options.worn.lower.index > 0
					&& options.worn.lower.setup.penis_img === 1
					&& calculatePenisBulge() - 6 > 0;
			},
		},
		"lower_penis_acc": {
			z: ZIndices.lower_top,
			filters: ["worn_lower_acc"],
			animation: "idle",

			//ToDo: add images for lower penis bulges. check against pregnancy belly
			srcfn(options) {
				return `img/clothes/lower/${options.worn.lower.setup.variable}/acc-penis.png`
			},
			showfn(options) {
				return options.show_clothes
					&& !options.belly_hides_lower
					&& options.worn.lower.index > 0
					&& options.worn.lower.setup.penis_acc_img === 1
					&& options.worn.lower.setup.accessory === 1
					&& calculatePenisBulge() - 6 > 0;
			},
		},
		"lower_back": genlayer_clothing_back_img('lower', {
			z: ZIndices.back_lower
		}),
		"lower_back_acc": genlayer_clothing_back_img_acc('lower', {
			z: ZIndices.back_lower
		}),
		/***
		 *     ██████  ██    ██ ███████ ██████  ██       ██████  ██     ██ ███████ ██████
		 *    ██    ██ ██    ██ ██      ██   ██ ██      ██    ██ ██     ██ ██      ██   ██
		 *    ██    ██ ██    ██ █████   ██████  ██      ██    ██ ██  █  ██ █████   ██████
		 *    ██    ██  ██  ██  ██      ██   ██ ██      ██    ██ ██ ███ ██ ██      ██   ██
		 *     ██████    ████   ███████ ██   ██ ███████  ██████   ███ ███  ███████ ██   ██
		 *
		 *
		 */
		"over_lower": genlayer_clothing_main('over_lower'),
		"over_lower_acc": genlayer_clothing_accessory('over_lower'),
		"over_lower_detail": genlayer_clothing_detail('over_lower'),
		"over_lower_back": genlayer_clothing_back_img('over_lower'),
		/***
		 *    ██    ██ ███    ██ ██████  ███████ ██████  ██       ██████  ██     ██ ███████ ██████
		 *    ██    ██ ████   ██ ██   ██ ██      ██   ██ ██      ██    ██ ██     ██ ██      ██   ██
		 *    ██    ██ ██ ██  ██ ██   ██ █████   ██████  ██      ██    ██ ██  █  ██ █████   ██████
		 *    ██    ██ ██  ██ ██ ██   ██ ██      ██   ██ ██      ██    ██ ██ ███ ██ ██      ██   ██
		 *     ██████  ██   ████ ██████  ███████ ██   ██ ███████  ██████   ███ ███  ███████ ██   ██
		 *
		 *
		 */
		"under_lower": genlayer_clothing_main('under_lower', {
			zfn(options) {
				return options.worn.lower.setup.high_img ?
					ZIndices.under_lower_high : ZIndices.under_lower;
			},
			masksrcfn(options) {
				return options.underLowerMask;
			},
		}),
		"under_lower_belly_2": genlayer_clothing_belly_2("under_lower", {
			masksrcfn(options) {
				return options.belly_mask_src;
			},
			zfn(options) {
				return options.worn.lower.setup.high_img ?
					ZIndices.under_lower_high : ZIndices.under_lower;
			},
			showfn(options) {
				return options.belly > 7
					&& options.show_clothes
					&& !options.belly_hides_under_lower
					&& options.worn.under_lower.index > 0
					&& options.worn.under_lower.setup.mainImage !== 0;
			},
		}),
		"under_lower_belly": genlayer_clothing_belly("under_lower", {
			masksrcfn(options) {
				return options.belly_mask_src;
			},
			zfn(options) {
				return options.worn.lower.setup.high_img ?
					ZIndices.under_lower_high : ZIndices.under_lower;
			},
			showfn(options) {
				return options.belly > 7
					&& options.show_clothes
					&& !options.belly_hides_under_lower
					&& options.worn.under_lower.index > 0
					&& options.worn.under_lower.setup.mainImage !== 0;
			},
		}),
		"under_lower_belly_shadow": genlayer_clothing_belly_shadow("under_lower", {
			zfn() {
				return ZIndices.under_lower_top_high;
			},
			showfn(options) {
				return (options.belly > 7 || (options.body_type === "soft" && !options.worn.under_upper.setup.outfitPrimary))
					&& options.show_clothes
					&& !options.belly_hides_under_lower
					&& options.worn.under_lower.index > 0
					&& options.worn.under_lower.setup.mainImage !== 0;
			},
		}),
		"under_lower_belly_acc": genlayer_clothing_belly_acc("under_lower", {
			masksrcfn(options) {
				return options.belly_mask_src;
			},
			zfn(options) {
				return options.worn.lower.setup.high_img ?
					ZIndices.under_lower_high : ZIndices.under_lower;
			},
			showfn(options) {
				return options.belly > 7
					&& options.show_clothes
					&& !options.belly_hides_under_lower
					&& options.worn.under_lower.index > 0
					&& options.worn.under_lower.setup.accessory === 1;
			},
		}),
		"under_lower_acc": genlayer_clothing_accessory("under_lower", {
			masksrcfn(options) {
				return options.underLowerMask;
			},
		}),
		"under_lower_detail": genlayer_clothing_detail("under_lower", {
			masksrcfn(options) {
				return options.underLowerMask;
			},
		}),
		"under_lower_penis": {
			z: ZIndices.under_lower_top,
			filters: ["worn_under_lower"],
			animation: "idle",

			//ToDo: expand the existing bulk images by providing a small bulge when `calculatePenisBulge()` is less than 8 (max is 15). check against pregnancy belly
			srcfn(options) {
				return `img/clothes/under-lower/${options.worn.under_lower.setup.variable}/penis.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& !options.belly_hides_under_lower
					&& options.worn.under_lower.index > 0
					&& options.worn.under_lower.setup.penis_img === 1
					&& calculatePenisBulge() > 0;
			},
			masksrcfn(options) {
				return options.underLowerMask;
			},
		},
		"under_lower_penis_acc": {
			z: ZIndices.under_lower_top,
			filters: ["worn_under_lower_acc"],
			animation: "idle",

			//ToDo: expand the existing bulk images by providing a small bulge when `calculatePenisBulge()` is less than 8 (max is 15). check against pregnancy belly
			srcfn(options) {
				return `img/clothes/under-lower/${options.worn.under_lower.setup.variable}/acc-penis.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& !options.belly_hides_under_lower
					&& options.worn.under_lower.index > 0
					&& options.worn.under_lower.setup.penis_acc_img === 1
					&& options.worn.under_lower.setup.accessory === 1
					&& calculatePenisBulge() > 0;
			},
			masksrcfn(options) {
				return options.underLowerMask;
			},
		},
		/***
		 *    ██    ██ ███    ██ ██████  ███████ ██████  ██    ██ ██████  ██████  ███████ ██████
		 *    ██    ██ ████   ██ ██   ██ ██      ██   ██ ██    ██ ██   ██ ██   ██ ██      ██   ██
		 *    ██    ██ ██ ██  ██ ██   ██ █████   ██████  ██    ██ ██████  ██████  █████   ██████
		 *    ██    ██ ██  ██ ██ ██   ██ ██      ██   ██ ██    ██ ██      ██      ██      ██   ██
		 *     ██████  ██   ████ ██████  ███████ ██   ██  ██████  ██      ██      ███████ ██   ██
		 *
		 *
		 */
		"under_upper": genlayer_clothing_main('under_upper', {
			masksrcfn(options) {
				if (options.belly >= 19 && options.worn.upper.setup.pregType == "split")
					return options.worn.under_upper.setup.pregType === "split"
						&& options.shirt_mask_clip_src;

				return options.underUpperMask;
			}
		}),
		"under_upper_fitted_left": genlayer_clothing_fitted_left("under_upper", {
			masksrcfn(options) {
				return options.under_upper_fitted_left_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? 2 : -2;
			},
		}),
		"under_upper_fitted_right": genlayer_clothing_fitted_right("under_upper", {
			masksrcfn(options) {
				return options.under_upper_fitted_right_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? -2 : 2;
			},
		}),
		"under_upper_fitted_left_acc": genlayer_clothing_fitted_left_acc("under_upper", {
			masksrcfn(options) {
				return options.under_upper_fitted_left_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? 2 : -2;
			},
		}),
		"under_upper_fitted_right_acc": genlayer_clothing_fitted_right_acc("under_upper", {
			masksrcfn(options) {
				return options.under_upper_fitted_right_move_src;
			},
			dxfn(options) {
				return options.body_type === "soft" ? -2 : 2;
			},
		}),
		"under_upper_belly_2": genlayer_clothing_belly_2("under_upper", {
			masksrcfn(options) {
				return options.belly_mask_src;
			},
			zfn() {
				return ZIndices.under_upper_top;
			},
		}),
		"under_upper_belly": genlayer_clothing_belly("under_upper", {
			masksrcfn(options) {
				return options.belly_mask_src;
			},
			zfn() {
				return ZIndices.under_upper_top;
			},
		}),
		"under_upper_belly_acc": genlayer_clothing_belly_acc("under_upper", {
			masksrcfn(options) {
				return options.belly_mask_src;
			},
			zfn(options) {
				return options.worn.lower.setup.high_img ?
					ZIndices.under_upper_top_acc : ZIndices.under_upper_top_acc;
			},
		}),
		"under_upper_breasts": genlayer_clothing_breasts("under_upper"),
		"under_upper_acc": genlayer_clothing_accessory('under_upper', {
			masksrcfn(options) {
				if (options.belly >= 19 && options.worn.upper.setup.pregType == "split")
					return options.worn.under_upper.setup.pregType === "split"
						&& options.shirt_mask_clip_src;

				if (!(options.worn.under_upper.setup.formfittingDisabled ?? []).includes("acc"))
				return options.underUpperMask;
			}
		}),
		"under_upper_breasts_acc": genlayer_clothing_breasts_acc('under_upper'),
		"under_upper_breasts_detail": genlayer_clothing_breasts_detail("under_upper"),
		"under_upper_back": genlayer_clothing_back_img('under_upper'),
		"under_upper_rightarm": genlayer_clothing_arm("right", "under_upper", {
			zfn(options) {
				return options.arm_right === "cover" || options.arm_right === "hold" ?
					options.zupperright - 1 : ZIndices.under_upper_arms;
			},
		}),
		"under_upper_leftarm": genlayer_clothing_arm("left", "under_upper", {
			zfn(options) {
				return options.arm_left === "cover" ? options.zupperleft - 1 : ZIndices.under_upper_arms;
			},
		}),
		"under_upper_leftarm_fitted": genlayer_clothing_arm_fitted("left", "under_upper", {
			zfn() {
				return ZIndices.under_upper_arms - 0.1;
			},
		}),
		"under_upper_leftarm_fitted_acc": genlayer_clothing_arm_acc_fitted("left", "under_upper", {
			zfn() {
				return ZIndices.under_upper_arms - 0.1;
			},
		}),
		"under_upper_rightarm_acc": genlayer_clothing_arm_acc("right", "under_upper", {
			zfn(options) {
				return options.arm_right === "cover" || options.arm_right === "hold" ?
					options.zupperright - 1 : ZIndices.under_upper_arms;
			},
		}),
		"under_upper_leftarm_acc": genlayer_clothing_arm_acc("left", "under_upper", {
			zfn(options) {
				return options.arm_left === "cover" ? options.zupperleft - 1 : ZIndices.under_upper_arms;
			},
		}),
		/***
		 *    ██   ██  █████  ███    ██ ██████  ███████
		 *    ██   ██ ██   ██ ████   ██ ██   ██ ██
		 *    ███████ ███████ ██ ██  ██ ██   ██ ███████
		 *    ██   ██ ██   ██ ██  ██ ██ ██   ██      ██
		 *    ██   ██ ██   ██ ██   ████ ██████  ███████
		 *
		 *
		 */
		"hands": genlayer_clothing_main('hands'),
		"hands_left": {
			filters: ["worn_hands"],
			animation: "idle",

			srcfn(options) {
				const pattern = options.worn.hands.pattern && !["tertiary", "secondary"].includes(options.worn.hands.setup.pattern_layer) ? "-" + options.worn.hands.pattern?.replace(/ /g,"-") : '';
				return `img/clothes/hands/${options.worn.hands.setup.variable}/left-${options.arm_left}${pattern}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.leftImage === 1
					&& options.arm_left !== "none";
			},
			zfn(options) {
				return options.arm_left === "cover" ? options.zupperleft - 0.5 : options.zarms + 0.2;
			},
		},
		"hands_left_acc": {
			filters: ["worn_hands_acc"],
			animation: "idle",

			srcfn(options) {
				const pattern = options.worn.hands.pattern && options.worn.hands.setup.pattern_layer === "secondary" ? "-" + options.worn.hands.pattern?.replace(/ /g,"-") : '';
				return `img/clothes/hands/${options.worn.hands.setup.variable}/left-${options.arm_left}${pattern}-acc.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.leftImage === 1
					&& options.worn.hands.setup.accessory === 1
					&& options.arm_left !== "none";
			},
			zfn(options) {
				return options.arm_left === "cover" ? options.zupperleft - 0.5 : options.zarms + 0.2;
			},
		},
		"hands_left_fitted": {
			filters: ["worn_hands"],
			animation: "idle",

			srcfn(options) {
				const pattern = options.worn.hands.pattern && !["tertiary", "secondary"].includes(options.worn.hands.setup.pattern_layer) ? "-" + options.worn.hands.pattern?.replace(/ /g,"-") : '';
				return `img/clothes/hands/${options.worn.hands.setup.variable}/left-${options.arm_left}${pattern}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.leftImage === 1
					&& ["curvy", "slender"].includes(options.body_type)
					&& options.arm_left === "idle"
					&& !(options.belly > 7)
			},
			masksrcfn(options) {
				return options.upper_fitted_left_move_src || options.under_upper_fitted_left_move_src ;
			},
			dxfn() {
				return -2;
			},
			zfn(options) {
				return options.zarms + 0.1;
			},
		},
		"hands_left_fitted_acc": {
			filters: ["worn_hands_acc"],
			animation: "idle",

			srcfn(options) {
				const pattern = options.worn.hands.pattern && options.worn.hands.setup.pattern_layer === "secondary" ? "-" + options.worn.hands.pattern?.replace(/ /g,"-") : '';
				return `img/clothes/hands/${options.worn.hands.setup.variable}/left-${options.arm_left}${pattern}-acc.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.leftImage === 1
					&& options.worn.hands.setup.accessory === 1
					&& ["curvy", "slender"].includes(options.body_type)
					&& options.arm_left === "idle"
					&& !(options.belly > 7);
			},
			masksrcfn(options) {
				return options.upper_fitted_left_move_src || options.under_upper_fitted_left_move_src;
			},
			dxfn() {
				return -2;
			},
			zfn(options) {
				return options.zarms + 0.1;
			},
		},
		"hands_left_detail": {
			animation: "idle",

			srcfn(options) {
				return `img/clothes/hands/${options.worn.hands.setup.variable}/left-${options.arm_left}-${options.worn.hands.pattern}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.leftImage === 1
					&& options.worn.hands.setup.pattern_layer === "tertiary"
					&& !!options.worn.hands.setup.pattern
					&& options.arm_right !== "none";
			},
			zfn(options) {
				return (options.arm_right === "cover" || options.arm_right === "hold") ?
					ZIndices.hands : options.zarms + 0.2;
			},
		},
		"hands_right": {
			filters: ["worn_hands"],
			animation: "idle",

			srcfn(options) {
				const pattern = options.worn.hands.pattern && !["tertiary", "secondary"].includes(options.worn.hands.setup.pattern_layer) ? "-" + options.worn.hands.pattern?.replace(/ /g,"-") : '';
				return `img/clothes/hands/${options.worn.hands.setup.variable}/right-${options.arm_right}${pattern}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.rightImage === 1
					&& options.arm_right !== "none";
			},
			zfn(options) {
				return ["cover", "hold"].includes(options.arm_right) ? options.zupperright - 0.5 : options.zarms + 0.2;
			},
		},
		"hands_right_acc": {
			filters: ["worn_hands_acc"],
			animation: "idle",

			srcfn(options) {
				const pattern = options.worn.hands.pattern && options.worn.hands.setup.pattern_layer === "secondary" ? "-" + options.worn.hands.pattern?.replace(/ /g,"-") : '';
				return`img/clothes/hands/${options.worn.hands.setup.variable}/right-${options.arm_right}${pattern}-acc.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.rightImage === 1
					&& options.worn.hands.setup.accessory === 1
					&& options.arm_right !== "none";
			},
			zfn(options) {
				return ["cover", "hold"].includes(options.arm_right) ? options.zupperright - 0.5 : options.zarms + 0.2;
			},
		},
		"hands_right_detail": {
			animation: "idle",

			srcfn(options) {
				return `img/clothes/hands/${options.worn.hands.setup.variable}/right-${options.arm_right}-${options.worn.hands.pattern}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.hands.index > 0
					&& options.worn.hands.setup.rightImage === 1
					&& options.worn.hands.setup.pattern_layer === "tertiary"
					&& !!options.worn.hands.setup.pattern
					&& options.arm_right !== "none";
			},
			zfn(options) {
				return (options.arm_right === "cover" || options.arm_right === "hold") ?
					ZIndices.hands : options.zarms + 0.2;
			},
		},
		/***
		 *    ██   ██  █████  ███    ██ ██████  ██   ██ ██████ ██     ██████
		 *    ██   ██ ██   ██ ████   ██ ██   ██ ██   ██ ██     ██     ██   ██
		 *    ███████ ███████ ██ ██  ██ ██   ██ ███████ ██████ ██     ██   ██
		 *    ██   ██ ██   ██ ██  ██ ██ ██   ██ ██   ██ ██     ██     ██   ██
		 *    ██   ██ ██   ██ ██   ████ ██████  ██   ██ ██████ ██████ ██████
		 *
		 *
		 */
		"handheld_right": genlayer_clothing_main('handheld', {
			srcfn(options) {
				const pattern = options.worn.handheld.pattern && !["tertiary", "secondary"].includes(options.worn.handheld.setup.pattern_layer) ? "-" + options.worn.handheld.pattern?.replace(/ /g,"-") : '';

				return `img/clothes/handheld/${options.worn.handheld.setup.variable}/right-${options.arm_right}${pattern}.png`;
			},
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || options.arm_right === "none" || (options.prop && options.prop.armPosition !== "handsfree")) return false;

				if (options.arm_right === "cover") return options.worn.handheld.setup.coverImage !== 0;
				return true;
			},
			zfn(options) {
				const setup = options.worn.handheld.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				if (options.arm_right === "cover") return ZIndices.arms_cover;
				if (!options.worn.handheld.setup.zIndex) return ZIndices.handheld;
				return ZIndices[options.worn.handheld.setup.zIndex];
			},
			animationfn(options) {
				return options.handheld_animation
			},
			filtersfn(options) {
				if (["feather"].includes(options.worn.handheld.setup.variable) && options.worn.handheld.colour === "grey") {
					return ["hair"];
				}
				return ["worn_handheld"];
			},
		}),
		"handheld_right_acc": genlayer_clothing_accessory('handheld', {
			srcfn(options) {
				const pattern = options.worn.handheld.pattern && !["tertiary", "primary"].includes(options.worn.handheld.setup.pattern_layer) ? "-" + options.worn.handheld.pattern?.replace(/ /g,"-") : '';

				return `img/clothes/handheld/${options.worn.handheld.setup.variable}/right-${options.arm_right}${pattern}-acc.png`;
			},
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || options.arm_right === "none" || (options.prop && options.prop?.armPosition !== "handsfree")) return false;

				if (options.arm_right === "cover") return options.worn.handheld.setup.accessory === 1 && options.worn.handheld.setup.coverImage !== 0;
				return options.worn.handheld.setup.accessory === 1;
			},
			zfn(options) {
				const setup = options.worn.handheld.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				if (options.arm_right === "cover") return ZIndices.arms_cover;
				if (!options.worn.handheld.setup.zIndex) return ZIndices.handheld;
				return ZIndices[options.worn.handheld.setup.zIndex];
			},
		}),
		"handheld_right_detail": genlayer_clothing_detail('handheld', {
			srcfn(options) {
				const pattern = options.worn.handheld.pattern ? "-" + options.worn.handheld.pattern?.replace(/ /g,"-") : "";
				return `img/clothes/handheld/${options.worn.handheld.setup.variable}/right-${options.arm_right}${pattern}.png`;
			},
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || options.arm_right === "none" || (options.prop && options.prop?.armPosition !== "handsfree")) return false;

				const hasRightDetail = options.worn.handheld.setup.pattern_layer === "tertiary" && !!options.worn.handheld.pattern;

				if (options.arm_right === "cover") return hasRightDetail && options.worn.handheld.setup.coverImage !== 0;
				return hasRightDetail;
			},
			zfn(options) {
				const setup = options.worn.handheld.setup;
				if (options.arm_right === "cover" && V.worn.handheld.holdPosition === "right_cover" && setup.zIndex) return ZIndices[setup.zIndex];
				if (options.arm_right === "cover") return ZIndices.arms_cover;
				if (!options.worn.handheld.setup.zIndex) return ZIndices.handheld;
				return ZIndices[options.worn.handheld.setup.zIndex];
			},
		}),
		"handheld_left": {
			srcfn(options) {
				return `img/clothes/handheld/${options.worn.handheld.setup.variable}/left-${options.arm_left}.png`;
			},
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || options.arm_left === "none" || (options.prop && options.prop.armPosition !== "handsfree")) return false;

				if (options.arm_left === "cover") return options.worn.handheld.setup.leftImage === 1 && options.worn.handheld.setup.coverImage;
				return options.worn.handheld.setup.leftImage === 1;
			},
			zfn(options) {
				if (options.arm_left === "cover") return ZIndices.old_over_upper;
				if (!options.worn.handheld.setup.zIndex) return ZIndices.handheld;
				return ZIndices[options.worn.handheld.setup.zIndex];
			},
			filtersfn() {
				return ["worn_handheld"];
			},
		},
		"handheld_left_acc": {
			srcfn(options) {
				return `img/clothes/handheld/${options.worn.handheld.setup.variable}/left-${options.arm_left}-acc.png`;
			},
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || options.arm_left === "none" || (options.prop && options.prop.armPosition !== "handsfree")) return false;

				const hasLeftAcc = options.worn.handheld.setup.leftImage === 1 && options.worn.handheld.setup.accessory === 1

				if (options.arm_left === "cover") return hasLeftAcc && options.worn.handheld.setup.coverImage;
				return hasLeftAcc;
			},
			zfn(options) {
				if (options.arm_left === "cover") return ZIndices.old_over_upper;
				if (!options.worn.handheld.setup.zIndex) return ZIndices.handheld;
				return ZIndices[options.worn.handheld.setup.zIndex];
			},
			filtersfn() {
				return ["worn_handheld_acc"];
			},
		},
		"handheld_left_detail": genlayer_clothing_detail('handheld', {
			srcfn(options) {
				const pattern = options.worn.handheld.pattern ? "-" + options.worn.handheld.pattern?.replace(/ /g,"-") : "";
				return `img/clothes/handheld/${options.worn.handheld.setup.variable}/left-${options.arm_left}${pattern}.png`;
			},
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || options.arm_left === "none" || (options.prop && options.prop.armPosition !== "handsfree"))
				return false;

				const hasLeftDetail = options.worn.handheld.setup.leftImage === 1 && !!options.worn.handheld.pattern && options.worn.handheld.setup.pattern_layer === "tertiary";

				if (options.arm_left === "cover") return hasLeftDetail && options.worn.handheld.setup.coverImage;
				return hasLeftDetail;
			},
			zfn(options) {
				if (options.arm_left === "cover") return ZIndices.old_over_upper;
				if (!options.worn.handheld.setup.zIndex) return ZIndices.handheld;
				return ZIndices[options.worn.handheld.setup.zIndex];
			},
		}),
		"handheld_back": genlayer_clothing_back_img('handheld', {
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || ["none", "cover"].includes(options.arm_right) || (options.prop && options.prop.armPosition !== "handsfree")) return false;

				return options.worn.handheld.setup.back_img === 1;
			},
			z: ZIndices.over_head_back
		}),
		"handheld_back_acc": genlayer_clothing_back_img_acc('handheld', {
			showfn(options) {
				if (options.worn.handheld.index <= 0 || !options.show_clothes || options.hide_all || ["none", "cover"].includes(options.arm_right) || (options.prop && options.prop.armPosition !== "handsfree")) return false;

				return options.worn.handheld.setup.back_img_acc === 1;
			},
			z: ZIndices.over_head_back
		}),
		/***
		 *    ██   ██ ███████  █████  ██████
		 *    ██   ██ ██      ██   ██ ██   ██
		 *    ███████ █████   ███████ ██   ██
		 *    ██   ██ ██      ██   ██ ██   ██
		 *    ██   ██ ███████ ██   ██ ██████
		 *
		 *
		 */
		"head": genlayer_clothing_main('head', {
			srcfn(options) {
				const dmg = options.worn.head.setup.accessory_integrity_img ? options.worn.upper.integrity : options.worn.head.integrity;
				const pattern = options.worn.head.pattern && !["tertiary", "secondary"].includes(options.worn.head.setup.pattern_layer) ? "-" + options.worn.head.pattern?.replace(/ /g,"-") : '';
				const isAltPosition = !options.alt_override && options.worn.head.setup.altposition !== undefined
					&& options.worn.head.alt === "alt"
					&& !options.worn.head.setup.altdisabled.includes("full");
				const end = isAltPosition ? '-alt' : '';

				return `img/clothes/head/${options.worn.head.setup.variable}/${dmg}${pattern}${end}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.head.index > 0
					&& options.worn.head.setup.mainImage !== 0
					&& !options.hide_all;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				if (options.worn.handheld.setup.mask_img === 1) {
					return `img/clothes/handheld/${options.worn.handheld.setup.variable}/mask.png`;
				};
			}
		}),
		"head_acc": genlayer_clothing_accessory('head', {
			srcfn(options) {
				const dmg = options.worn.head.setup.accessory_integrity_img ? `-${options.worn.upper.integrity}` : '';
				const pattern = options.worn.head.pattern && options.worn.head.setup.pattern_layer === "secondary" ? "-" + options.worn.head.pattern?.replace(/ /g,"-") : '';
				return `img/clothes/head/${options.worn.head.setup.variable}/acc${dmg}${pattern}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.head.index > 0
					&& options.worn.head.setup.accImage !== 0
					&& options.worn.head.setup.accessory === 1
					&& !options.hideHeadAcc
					&& !options.hide_all;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				if (options.worn.handheld.setup.mask_img === 1) {
					return `img/clothes/handheld/${options.worn.handheld.setup.variable}/mask.png`;
				};
			}
		}),
		"head_detail": genlayer_clothing_detail('head', {
			showfn(options) {
				return options.show_clothes
					&& options.worn.head.index > 0
					&& options.worn.head.setup.mainImage !== 0
					&& options.worn.head.setup.pattern_layer === "tertiary"
					&& !!options.worn.head.pattern
					&& !options.hide_all;
			},
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				if (options.worn.handheld.setup.mask_img === 1) {
					return `img/clothes/handheld/${options.worn.handheld.setup.variable}/mask.png`;
				};
			}
		}),
		"head_back_acc": genlayer_clothing_back_img_acc('head', {
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				if (options.worn.handheld.setup.mask_img === 1) {
					return `img/clothes/handheld/${options.worn.handheld.setup.variable}/mask.png`;
				}
				return options.headMask;
			}
		}),
		"head_back": genlayer_clothing_back_img('head', {
			masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
				if (options.worn.handheld.setup.mask_img === 1) {
					return `img/clothes/handheld/${options.worn.handheld.setup.variable}/mask.png`;
				}
				return options.headMask;
			}
		}),
		/***
		 *     ██████  ██    ██ ███████ ██████          ██   ██ ███████  █████  ██████
		 *    ██    ██ ██    ██ ██      ██   ██         ██   ██ ██      ██   ██ ██   ██
		 *    ██    ██ ██    ██ █████   ██████          ███████ █████   ███████ ██   ██
		 *    ██    ██  ██  ██  ██      ██   ██         ██   ██ ██      ██   ██ ██   ██
		 *     ██████    ████   ███████ ██   ██ ███████ ██   ██ ███████ ██   ██ ██████
		 *
		 *
		 */
		"over_head": genlayer_clothing_main('over_head'),
		"over_head_acc": genlayer_clothing_accessory('over_head'),
		"over_head_back_acc": genlayer_clothing_back_img_acc('over_head'),
		"over_head_back": genlayer_clothing_back_img('over_head'),
		/***
		 *    ███████  █████   ██████ ███████
		 *    ██      ██   ██ ██      ██
		 *    █████   ███████ ██      █████
		 *    ██      ██   ██ ██      ██
		 *    ██      ██   ██  ██████ ███████
		 *
		 *
		 */

		"face": genlayer_clothing_main('face', {
			zfn(options) {
				const isAltPosition = !options.alt_override
					&& options.worn.face.setup.altposition !== undefined
					&& options.worn.face.alt === "alt";
				const check = isAltPosition
					&& (options.worn.face.setup.type.includes("cool")
						|| options.worn.face.setup.type.includes("glasses"));

				if (check) return ZIndices.over_head;
				return options.facewear_layer === "front" ? ZIndices.facewear - 12.5 : ZIndices.facewear;
			},
		}),
		"face_acc": genlayer_clothing_accessory('face', {
			zfn(options) {
				const isAltPosition = !options.alt_override
					&& options.worn.face.setup.altposition !== undefined
					&& options.worn.face.alt === "alt";
				const check = isAltPosition
					&& (options.worn.face.setup.type.includes("cool")
						|| options.worn.face.setup.type.includes("glasses"));

				if (check) return ZIndices.over_head;
				return options.facewear_layer === "front" ? ZIndices.facewear - 12.5 : ZIndices.facewear;
			},
		}),
		"face_back_acc": genlayer_clothing_back_img_acc('face'),
		"face_back": genlayer_clothing_back_img('face'),

		/***
		 *    ███    ██ ███████  ██████ ██   ██
		 *    ████   ██ ██      ██      ██  ██
		 *    ██ ██  ██ █████   ██      █████
		 *    ██  ██ ██ ██      ██      ██  ██
		 *    ██   ████ ███████  ██████ ██   ██
		 *
		 *
		 */
		"neck": genlayer_clothing_main('neck', {
			srcfn(options) {
				const isAltPosition = !options.alt_override
					&& options.worn.neck.setup.altposition !== undefined
					&& options.worn.neck.alt === "alt";

				let collar = "";
				if (options.worn.neck.setup.has_collar === 1 && options.worn.upper.setup.has_collar === 1 && !(options.worn.upper.setup.name === "dress shirt" && options.worn.upper.alt === "alt")) {
					collar = '-nocollar';
				} else if (options.worn.neck.setup.name === "sailor ribbon" && options.worn.upper.setup.name === "serafuku") {
					collar = "-serafuku";
				}
				const pattern = options.worn.neck.pattern && !["tertiary", "secondary"].includes(options.worn.neck.pattern_layer) ? "-" + options.worn.neck.pattern?.replace(/ /g,"-") : '';
				const alt = isAltPosition ? '-alt' : '';

				const setupVar = options.worn.neck.setup.variable;
				const integrity = options.worn.neck.integrity;
				return `img/clothes/neck/${setupVar}/${integrity}${collar}${pattern}${alt}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.neck.index > 0
					&& options.worn.neck.setup.mainImage !== 0
					&& !options.hide_all;
			},
			masksrcfn(options) {
				return options.high_waist_suspenders ? "img/clothes/neck/suspenders/mask.png" : null;
			},
			zfn(options) {
				const setup = options.worn.neck.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				return options.hood_mask ? ZIndices.collar : ZIndices.neck;
			},
		}),
		"neck_acc": genlayer_clothing_accessory('neck', {
			srcfn(options) {
				const isAltPosition = !options.alt_override
					&& options.worn.neck.setup.altposition !== undefined
					&& options.worn.neck.alt === "alt";
				const integrity = options.worn.neck.setup.accessory_integrity_img ? `-${options.worn.neck.integrity}` : '';
				const alt = isAltPosition ? '-alt' : '';
				const pattern = options.worn.neck?.pattern && options.worn.neck?.pattern_layer === "secondary" ? "-" + options.worn.neck.pattern?.replace(/ /g,"-") : '';

				const setupVar = options.worn.neck.setup.variable;
				return `img/clothes/neck/${setupVar}/acc${integrity}${pattern}${alt}.png`;
			},
			showfn(options) {
				return options.show_clothes
					&& options.worn.neck.index > 0
					&& options.worn.neck.setup.accImage !== 0
					&& options.worn.neck.setup.accessory === 1
					&& !options.hideLeash;
			},
			zfn(options) {
				const setup = options.worn.neck.setup;
				if (setup.zIndex) return ZIndices[setup.zIndex];
				const check = options.worn.head.setup.mask_img === 1
					&& !(options.hood_down
						&& options.worn.head.setup.hood
						&& options.worn.head.setup.outfitSecondary !== undefined);
				return check ? ZIndices.collar : ZIndices.neck;
			},
			dyfn(options) {
				return options.high_waist_suspenders ? -8 : 0;
			},
		}),
		/***
		 *    ██      ███████  ██████  ███████
		 *    ██      ██      ██       ██
		 *    ██      █████   ██   ███ ███████
		 *    ██      ██      ██    ██      ██
		 *    ███████ ███████  ██████  ███████
		 *
		 *
		 */
		"legs": genlayer_clothing_main('legs', {
			zfn(options) {
				const check = (options.worn.under_lower.setup.set === options.worn.under_upper.setup.set
					|| options.worn.under_lower.setup.high_img === 1) && options.worn.legs.setup.high_img !== 1;

				if (check) return ZIndices.legs;
				return ZIndices.legs_high;
			},
			masksrcfn(options) {
				return options.legsMask;
			},
		}),
		"legs_acc": genlayer_clothing_accessory('legs', {
			zfn(options) {
				const check = options.worn.under_lower.setup.set === options.worn.under_upper.setup.set
					|| options.worn.under_lower.setup.high_img === 1;

				if (check) return ZIndices.legs;
				return ZIndices.legs_high;
			},
			masksrcfn(options) {
				return options.legsMask;
			},
		}),
		"legs_detail": genlayer_clothing_detail('legs', {
			showfn(options) {
				return options.show_clothes
					&& options.worn.legs.index > 0
					&& options.worn.legs.setup.mainImage !== 0
					&& options.worn.legs.setup.pattern_layer === "tertiary"
					&& !!options.worn.legs.pattern
					&& !options.hide_all;
			},
		}),
		"legs_back_acc": genlayer_clothing_back_img_acc('legs'),
		"legs_back": genlayer_clothing_back_img('legs'),
		/***
		 *    ███████ ███████ ███████ ████████
		 *    ██      ██      ██         ██
		 *    █████   █████   █████      ██
		 *    ██      ██      ██         ██
		 *    ██      ███████ ███████    ██
		 *
		 *
		 */
		"feet": genlayer_clothing_main('feet', {
			zfn(options) {
				const check = options.lower_tucked
					&& !options.worn.lower.setup.notuck
					&& !options.worn.feet.setup.notuck;

				if (check) return ZIndices.lower_tucked_feet;
				return ZIndices.feet;
			},
		}),
		"feet_acc": genlayer_clothing_accessory('feet', {
			zfn(options) {
				const check = options.lower_tucked
					&& !options.worn.lower.setup.notuck
					&& !options.worn.feet.setup.notuck;

				if (check) return ZIndices.lower_tucked_feet;
				return ZIndices.feet;
			},
		}),
		"feet_details": genlayer_clothing_detail('feet'),
		"feet_back_acc": genlayer_clothing_back_img_acc('feet'),
		"feet_back": genlayer_clothing_back_img('feet'),
		/***
		 *    ███████  ██████  ██      ██       ██████  ██     ██ ███████ ██████
		 *    ██      ██    ██ ██      ██      ██    ██ ██     ██ ██      ██   ██
		 *    █████   ██    ██ ██      ██      ██    ██ ██  █  ██ █████   ██████
		 *    ██      ██    ██ ██      ██      ██    ██ ██ ███ ██ ██      ██   ██
		 *    ██       ██████  ███████ ███████  ██████   ███ ███  ███████ ██   ██
		 */
		"follower_base": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.base}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.base;
			},
			z: ZIndices.head,
		},
		"follower_left_arm": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.left_arm}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.left_arm;
			},
			z: ZIndices.head + 1,
		},
		"follower_clothes_left_arm": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.clothes_left_arm}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.clothes_left_arm;
			},
			z: ZIndices.head + 4,
		},
		"follower_hair": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.hair}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.hair;
			},
			z: ZIndices.head + 6,
		},
		"follower_under_clothes": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.under_clothes}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.under_clothes;
			},
			z: ZIndices.head + 3,
		},
		"follower_clothes": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.clothes}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.clothes;
			},
			z: ZIndices.head + 5,
		},
		"follower_writing_right_cheek": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_right_cheek}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_right_cheek;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_chest": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_chest}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_chest;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_left_arm": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_left_arm}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_left_arm;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_right_arm": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_right_arm}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_right_arm;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_left_shoulder": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_left_shoulder}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_left_shoulder;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_right_shoulder": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_right_shoulder}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_right_shoulder;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_left_thigh": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_left_thigh}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_left_thigh;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_right_thigh": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_right_thigh}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_right_thigh;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_left_leg": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_left_leg}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_left_leg;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_right_leg": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_right_leg}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_right_leg;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_left_foot": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_left_foot}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_left_foot;
			},
			z: ZIndices.head + 2,
		},
		"follower_writing_right_foot": {
			animation: "idle",
			srcfn(options) {
				return `img/clothes/props/npc/${options.follower.name}/${options.follower.writing_right_foot}.png`;
			},
			showfn(options) {
				return !!options.follower && !!options.follower.writing_right_foot;
			},
			z: ZIndices.head + 2,
		},
		/**
		 *     ██████  █████  ███    ██ ██    ██  █████  ███████
		 *    ██      ██   ██ ████   ██ ██    ██ ██   ██ ██
		 *    ██      ███████ ██ ██  ██ ██    ██ ███████ ███████
		 *    ██      ██   ██ ██  ██ ██  ██  ██  ██   ██      ██
		 *     ██████ ██   ██ ██   ████   ████   ██   ██ ███████
		 *
		 *    ███████ ███████ ███████ ███████  ██████ ████████ ███████
		 *    ██      ██      ██      ██      ██         ██    ██
		 *    █████   █████   █████   █████   ██         ██    ███████
		 *    ██      ██      ██      ██      ██         ██         ██
		 *    ███████ ██      ██      ███████  ██████    ██    ███████
		 */

		"precipitation_back": {
			animationfn() {
				return Weather.precipitation === "snow" ? "snowBack" : "rain";
			},
			srcfn() {
				const type = Weather.precipitation;
				const intensity = normaliseFileName(Weather.name);
				return `img/misc/ambient/precipitation/${type}/${intensity}-back.png`;
			},
			showfn(options) {
				return !T.hideSidebarEffects && !!options.precipitation;
			},
			z: ZIndices.background,
		},
		"precipitation_front": {
			animationfn() {
				return Weather.precipitation === "snow" ? "snowFront" : "rain";
			},
			srcfn() {
				const type = Weather.precipitation;
				const intensity = normaliseFileName(Weather.name);
				return `img/misc/ambient/precipitation/${type}/${intensity}-front.png`;
			},
			showfn(options) {
				return !T.hideSidebarEffects && !!options.precipitation;
			},
			z: ZIndices.foreground,
		},
		"cold_breath": {
			animationfn() {
				return (V.arousal >= 6000 || V.pain >= 40) ? "playerBreathFast" : "playerBreath";
			},
			src: `img/misc/ambient/player-breath.png`,
			showfn(options) {
				return !T.hideSidebarEffects && !!options.temperature;
			},
			z: ZIndices.foreground,
		},
		"water_breath": {
			animationfn() {
				return (V.arousal >= 6000 || V.pain >= 40) ? "waterBreathFast" : "waterBreath";
			},
			src: `img/misc/ambient/water/breath.png`,
			showfn(options) {
				return !T.hideSidebarEffects && !!options.water;
			},
			z: ZIndices.foreground,
		},
		"water_back": {
			animation: "waterBack",
			src: `img/misc/ambient/water/back.png`,
			showfn(options) {
				return !T.hideSidebarEffects && !!options.water;
			},
			z: ZIndices.background,
		},
		"water_front": {
			animation: "waterFront",
			src: `img/misc/ambient/water/front.png`,
			showfn(options) {
				return !T.hideSidebarEffects && !!options.water;
			},
			z: ZIndices.foreground,
		},
		"fire_back": {
			animationfn() {
				const intensity = V.farm_assault ? 2 : T.tempEffects?.fire || V.fire;
				return `fireBack${intensity}`;
			},
			srcfn() {
				const intensity = V.farm_assault ? 2 : T.tempEffects?.fire || V.fire;
				return `img/misc/ambient/fire/back-${intensity}.png`;
			},
			showfn(options) {
				return !T.hideSidebarEffects && !!options.fire;
			},
			z: ZIndices.background,
		},
		"fire_front": {
			animation: "fireFront",
			src: `img/misc/ambient/fire/front.png`,
			showfn(options) {
				return !T.hideSidebarEffects && (!!options.fire || !!options.fireFront);
			},
			z: ZIndices.foreground,
		},
		"petals_back": {
			animationfn() {
				const direction = T.tempEffects?.petals === "reverse" ? "Floating" : "Falling";
				return `petals${direction}`;
			},
			srcfn(options) {
				return `img/misc/ambient/petals/back-${options.petalColour}.png`;
			},
			showfn(options) {
				return !T.hideSidebarEffects && !!options.petals;
			},
			z: ZIndices.background,
		},
		"petals_front": {
			animationfn() {
				const direction = T.tempEffects?.petals === "reverse" ? "Floating" : "Falling";
				return `petals${direction}`;
			},
			srcfn(options) {
				return `img/misc/ambient/petals/front-${options.petalColour}.png`;
			},
			showfn(options) {
				return !T.hideSidebarEffects && !!options.petals;
			},
			z: ZIndices.foreground,
		},
		"vines": {
			animation: "idle",
			z: ZIndices.upper,
			showfn(options) {
				return !!options.vines;
			},
			src: `img/clothes/feet/vines/full-body.png`,
		},
		"prop": genlayer_prop(),
		"prop_acc": genlayer_prop_acc(),
		"prop_underarm": genlayer_prop({
			showfn(options) {
				return !!options.prop.show && !!options.prop.overUnderSplit;
			},
			srcfn(options) {
				return `img/clothes/props/${options.prop.folder}/${options.prop.name}-underarm.png`
			},
			zfn(options) {
				return options.zupperright - 1;
			},
		}),
		"prop_underarm_acc": genlayer_prop_acc({
			showfn(options) {
				return !!options.prop.show && !!options.prop.overUnderAccSplit;
			},
			srcfn(options) {
				return `img/clothes/props/${options.prop.folder}/${options.prop.name}-underarm-acc.png`
			},
			zfn(options) {
				return options.zupperright - 1;
			},
		}),
		"wraithFlash": {
			animation: "wraithFlash",
			showfn(options) {
				if (!options.wraithFlash || !Time.isBloodMoon() || V.combat) return false;
				// V.daily.wraithFlash is reused by the accent animation to make sure they always run together.
				if (V.daily.wraithFlash) return false;
				if (random(1, 70) === 1) {
					V.daily.wraithFlash = true;
					return true;
				}
				return false;
			},
			srcfn() {
				const hasBlueEyes = !["haunt", "despair"].includes(V.wraith.state);
				return hasBlueEyes ? "img/misc/ambient/wraith/wraith-flash-blue.png" : "img/misc/ambient/wraith/wraith-flash-red.png";
			},
			scale: false,
			width: 256,
			height: 256,
			dy: 0,
			z: ZIndices.background,
		},
		"wraithFlashAccent": {
			animation: "wraithFlashAccent",
			showfn(options) {
				if (!options.wraithFlash || !Time.isBloodMoon() || V.combat) return false;
				const hasBlueEyes = !["haunt", "despair"].includes(V.wraith.state);
				return !hasBlueEyes && V.daily.wraithFlash;
			},
			srcfn() {
				const hasBlueEyes = !["haunt", "despair"].includes(V.wraith.state);
				return hasBlueEyes ? "img/misc/ambient/wraith/wraith-flash-blue.png" : "img/misc/ambient/wraith/wraith-flash-red.png";
			},
			scale: false,
			width: 256,
			height: 256,
			dy: 0,
			z: ZIndices.background,
		},
		"wraithMirror": {
			animation: "wraithMirrorFade",
			showfn() {
				return !!T.wraithMirror;
			},
			srcfn() {
				const hasBlueEyes = !["haunt", "despair"].includes(V.wraith?.state);
				return hasBlueEyes ? "img/misc/ambient/wraith/wraith-flash-blue.png" : "img/misc/ambient/wraith/wraith-flash-red.png";
			},
			scale: false,
			width: 256,
			height: 256,
			dy: 0,
			z: ZIndices.background,
		},

		// new layer template
		/*
		"": {
			srcfn(options) {
				return ""
			},
			z: ZIndices.,
			animation: "idle"
		},
		*/
	}
}

// Utility functions
// Generate filters for colour-by-name properties
/**
 * For colour name, lookup its canvas filter and merge with sprite prefilter.
 * @param {object} options
 * @param {object} dict map in setup.colours to lookup in
 * @param {string} key colour name
 * @param {string} debugName used when reporting errors
 * @param {string} customFilterName key in options.filters
 * @param {string} prefilterName name of prefilter to apply
 * @return {CompositeLayerParams}
 */
function lookupColour(options, dict, key, debugName, customFilterName, prefilterName) {
	let filter;
	if (key === "custom") {
		filter = clone(options.filters[customFilterName]);
		if (!filter) {
			console.error(`custom ${debugName} colour not configured`);
			return {};
		}
	} else {
		let record = dict[key];
		if (!record) {
			console.error(`unknown ${debugName} colour: ${key}`);
			return {};
		}
		filter = clone(record.canvasfilter);
	}

	if (prefilterName) {
		Renderer.mergeLayerData(
			filter,
			setup.colours.sprite_prefilters[prefilterName],
			true
		);
	}
	return filter;
}

function createHairColourGradient(hairPart, gradient, hairType, hairLength, prefilterName) {
	const filterPrototypeLibrary = setup.colours.hairgradients_prototypes[hairPart][gradient.style];
	const filterPrototype = filterPrototypeLibrary[hairType] || filterPrototypeLibrary.all;
	const filter = {
		blend: clone(filterPrototype),
		brightness: {
			gradient: filterPrototype.gradient,
			values: filterPrototype.values,
			adjustments: [[], []]
		},
		blendMode: "hard-light"
	};

	for (const colorIndex in filter.blend.colors) {
		filter.brightness.adjustments[colorIndex][0] = filter.blend.lengthFunctions[0](hairLength, filter.blend.colors[colorIndex][0]);
		filter.brightness.adjustments[colorIndex][1] = setup.colours.hair_map[gradient.colours[colorIndex]].canvasfilter.brightness || 0;

		filter.blend.colors[colorIndex][0] = filter.blend.lengthFunctions[0](hairLength, filter.blend.colors[colorIndex][0]);
		filter.blend.colors[colorIndex][1] = setup.colours.hair_map[gradient.colours[colorIndex]].canvasfilter.blend;
	}

	Renderer.mergeLayerData(filter, setup.colours.sprite_prefilters[prefilterName], true);
	return filter;
}

function isPartEnabled(type) {
	/* TODO: Enable this check and fix cases that have fallen prey to this design flaw of returning true for undefined.
		It is better to catch potential errors and ensure a standard is kept. */
	/* Check for undefined in case the object given was a typo. 06/10/22 Sneaky incident :trolldispair: */
	if (typeof type !== "string") {
		if (V.debug || V.options.debugdisable === "f") {
			Errors.report("isPartEnabled was given an unexpected value.", type);
		}
		// return false;
	};
	return type !== "disabled" && type !== "hidden";
}
window.isPartEnabled = isPartEnabled;

/**
 *
 * @param {TransformationKeys} type
 * @param {TransformationParts} part
 * @returns {boolean}
 */
function isTransformationPartEnabled(type, part) {
	const transformations = V.transformationParts;
	if (transformations == null) {
		return false;
	}
	/** @type {AngelTransformationParts=} */
	const transformation = transformations[type];
	if (transformation == null) {
		return false;
	}
	/** @type {string=} */
	const item = transformation[part];
	if (typeof item !== "string") {
		return false;
	};
	return item !== "disabled" && item !== "hidden";
}
window.isTransformationPartEnabled = isTransformationPartEnabled;

function isChimeraEnabled(type, part) {
	if (typeof V.chimera !== 'object') {
		/* No need to post errors for $chimera, only user inputs (type&part) */
		return false;
	}
	if (typeof V.chimera[type] !== 'object') {
		return false;
	}
	if (V.chimera[type][part] == null) {
		return false;
	}
	return !!V.chimera[type][part];
}
window.isChimeraEnabled = isChimeraEnabled;

function getWritingImgPath(area_name, writing) {
	if (writing.type === "text") {
		if (writing.sprites && writing.sprites.length > 0 && writing.sprites.includes(area_name)) {
			return `img/bodywriting/text/${writing.key.replace(/_/g,"-")}/${area_name.replace(/_/g,"-")}.png`;
		}
		return `img/bodywriting/text/default/${area_name.replace(/_/g,"-")}.png`;
	}
	if (writing.type === "object") return `img/bodywriting/${writing.writing.replace(/_/g,"-")}/${area_name.replace(/_/g,"-")}.png`;
	return '';
}

function getWritingImgPathArrow(area_name, writing) {
	if (writing.type === "text") {
		if (writing.sprites && writing.sprites.length > 0 && writing.sprites.includes(area_name)) {
			return `img/bodywriting/text/${writing.key.replace(/_/g,"-")}/${area_name.replace(/_/g,"-")}.png`;
		}
		return `img/bodywriting/text/default/${area_name.replace(/_/g,"-")}${writing.arrow ? "-arrow" : ""}.png`;
	}
	if (writing.type === "object") return `img/bodywriting/${writing.writing.replace(/_/g,"-")}/${area_name.replace(/_/g,"-")}.png`;
	return '';
}

function generateClothingFilter(options, slot, item) {
	const filter = (item.setup.colour_sidebar) ? lookupColour(
		options,
		setup.colours.clothes_map,
		item.colour,
		slot + " clothing",
		`worn_${slot}_custom`,
		item.setup.prefilter
	) : Renderer.emptyLayerFilter();

	return filter;
}
window.generateClothingFilter = generateClothingFilter;

function generateClothingAccFilter(options, slot, item) {
	const filter = (item.setup.accessory_colour_sidebar) ? lookupColour(
		options,
		setup.colours.clothes_map,
		item.accColour,
		slot + " accessory",
		`worn_${slot}_acc_custom`,
		item.setup.prefilter
	) : Renderer.emptyLayerFilter();

	return filter;
}
window.generateClothingAccFilter = generateClothingAccFilter;

// Layer generating functions.
function getClothingPathBreastsAcc(slot, options) {
	const breastImg = options.worn[slot].setup.breast_img;
	const breastAccImg = options.worn[slot].setup.breast_acc_img;
	const breastSize = typeof breastAccImg === 'object' ? breastAccImg[options.breast_size] : typeof breastImg === 'object' ? breastImg[options.breast_size] : Math.min(options.breast_size, 6);
	const pattern = options.worn[slot].pattern && options.worn[slot].setup.pattern_layer === "secondary" ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
	const folder = normaliseFileName(slot);
	return `img/clothes/${folder}/${options.worn[slot].setup.variable}/${breastSize}-acc${pattern}.png`;
}

function filterFnArm(state, slot, options) {
	const altFilterSwap = !options.alt_override
	&& options.worn[slot].setup.altposition !== undefined
	&& options.worn[slot].alt === 'alt'
	&& options.worn[slot].setup.altdisabled.includes('filter');
	switch (state) {
		case undefined:
		case "":
		case "primary":
			return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
		case 1:
		case "secondary":
			return altFilterSwap ? [`worn_${slot}`] : [`worn_${slot}_acc`];
		case "pattern":
			switch (options.worn[slot].setup.pattern_layer) {
				case "tertiary":
					return [];
				case "secondary":
					return [`worn_${slot}_acc`]
				default:
					return [`worn_${slot}`]
			}
		default:
			return [];
	}
}

function genlayer_prop(overrideOptions) {
	return Object.assign({
		animationfn(options) {
			return options.prop.animation;
		},
		filtersfn(options) {
			if (options.prop.colour === "hair") return ["hair"];
			return ["prop"];
		},
		showfn(options) {
			return !!options.prop.show;
		},
		srcfn(options) {
			return `img/clothes/props/${options.prop.folder}/${options.prop.name}.png`
		},
		zfn(options) {
			return ZIndices[options.prop.zIndex];
		},
	}, overrideOptions);
}

function genlayer_prop_acc(overrideOptions) {
	return genlayer_prop(Object.assign({
		filtersfn(options) {
			if (options.prop.accColour === "hair") return ["hair"];
			return ["prop_acc"];
		},
		showfn(options) {
			return !!options.prop.show && !!options.prop.hasAccessory;
		},
		srcfn(options) {
			return `img/clothes/props/${options.prop.folder}/${options.prop.name}-acc.png`
		},
	}, overrideOptions));
}


function genlayer_clothing_basic(slot, overrideOptions) {
	return Object.assign({
		animation: "idle",
		alphafn(options) {
			return options.worn[slot].alpha;
		},
		wornfn(options) {
			return {
				slot,
				integrity: options.worn[slot].integrity,
				alt: options.worn[slot].alt,
				index: options.worn[slot].setup.index
			}
		},
	}, overrideOptions);
}

function genlayer_clothing_main(slot, overrideOptions) {
	return genlayer_clothing_basic(slot, Object.assign({
		z: ZIndices[slot],
		filtersfn(options) {
			const altFilterSwap = !options.alt_override
				&& options.worn[slot].setup.altposition !== undefined
				&& options.worn[slot].alt === 'alt'
				&& options.worn[slot].setup.altdisabled.includes('filter');
			return altFilterSwap ? [`worn_${slot}_acc`] : [`worn_${slot}`];
		},

		showfn(options) {
			return options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.mainImage !== 0;
		},
		srcfn(options) {
			const setup = options.worn[slot].setup;
			const folder = normaliseFileName(slot);

			const isHoodDown = options.hood_down
				&& setup.hoodposition !== undefined
				&& setup.outfitPrimary.head !== undefined;
			const isAltPosition = !options.alt_override && setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("full");

			const pattern = options.worn[slot].pattern && !["secondary", "tertiary"].includes(options.worn[slot].setup.pattern_layer) ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';

			const end = isHoodDown ? '-down' : isAltPosition ? '-alt' : '';
			return `img/clothes/${folder}/${setup.variable}/${options.worn[slot].integrity}${pattern}${end}.png`;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume" && !slot.startsWith("over_"))
				return `img/clothes/over-upper/kaiju/mask.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_fitted_left(slot, overrideOptions) {
	return genlayer_clothing_main(slot, Object.assign({
		showfn(options) {
			const checks = options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.mainImage !== 0
				&& ((options.worn[slot].setup.formfitting === 1 && ["curvy", "slender"].includes(options.body_type)) || (options.body_type === "soft" && ((V.bellyTucked && ["under_lower", "lower"].includes(slot)) || V.worn[slot].setup.one_piece)))
				&& !between(options.belly, 8, 24);
			return checks;
		},
	}, overrideOptions));
}

function genlayer_clothing_fitted_right(slot, overrideOptions) {
	return genlayer_clothing_main(slot, Object.assign({
		showfn(options) {
			const checks = options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.mainImage !== 0
				&& ((options.worn[slot].setup.formfitting === 1 && options.body_type == "curvy") || (options.body_type === "soft" && ((V.bellyTucked && ["under_lower", "lower"].includes(slot)) || V.worn[slot].setup.one_piece)))
				&& !between(options.belly, 8, 24);
			return checks;
		},
	}, overrideOptions));
}

function genlayer_clothing_fitted_left_acc(slot, overrideOptions) {
	return genlayer_clothing_accessory(slot, Object.assign({
		showfn(options) {
			const checks = options.worn[slot].index > 0
				&& options.worn[slot].setup.accImage !== 0
				&& options.worn[slot].setup.accessory === 1
				&& ((options.worn[slot].setup.formfitting === 1 && ["curvy", "slender"].includes(options.body_type)) || (options.body_type === "soft" && (V.bellyTucked || V.worn[slot].setup.one_piece)))
				&& !(options.worn[slot].setup.formfittingDisabled ?? []).includes("acc")
				&& !between(options.belly, 8, 24);
			return checks;
		},

		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isHoodDown = options.hood_down
				&& setup.hoodposition !== undefined
				&& setup.outfitPrimary.head !== undefined;
			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("acc");

			const integrity = setup.accessory_integrity_img ? `-${options.worn[slot].integrity}` : '';
			const pattern = options.worn[slot].pattern && options.worn[slot].setup.pattern_layer === "secondary" ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const end = isHoodDown ? '-down' : isAltPosition ? '-alt' : '';
			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/acc${integrity}${pattern}${end}.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_fitted_right_acc(slot, overrideOptions) {
	return genlayer_clothing_accessory(slot, Object.assign({
		showfn(options) {
			const checks = options.worn[slot].index > 0
				&& options.worn[slot].setup.accImage !== 0
				&& options.worn[slot].setup.accessory === 1
				&& ((options.worn[slot].setup.formfitting === 1 && options.body_type == "curvy") || (options.body_type === "soft" && (V.bellyTucked || V.worn[slot].setup.one_piece)))
				&& !(options.worn[slot].setup.formfittingDisabled ?? []).includes("acc")
				&& !between(options.belly, 8, 24);
			return checks;
		},

		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isHoodDown = options.hood_down
				&& setup.hoodposition !== undefined
				&& setup.outfitPrimary.head !== undefined;
			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("acc");

			const integrity = setup.accessory_integrity_img ? `-${options.worn[slot].integrity}` : '';
			const pattern = options.worn[slot].pattern && options.worn[slot].setup.pattern_layer === "secondary" ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const end = isHoodDown ? '-down' : isAltPosition ? '-alt' : '';
			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/acc${integrity}${pattern}${end}.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_accessory(slot, overrideOptions) {
	return genlayer_clothing_main(slot, Object.assign({
		filtersfn(options) {
			const altFilterSwap = !options.alt_override
				&& options.worn[slot].setup.altposition !== undefined
				&& options.worn[slot].alt === 'alt'
				&& options.worn[slot].setup.altdisabled.includes('filter');
			return altFilterSwap ? [`worn_${slot}`] : [`worn_${slot}_acc`];
		},
		showfn(options) {
			return options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.accImage !== 0
				&& options.worn[slot].setup.accessory === 1;
		},
		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isHoodDown = options.hood_down
				&& setup.hoodposition !== undefined
				&& setup.outfitPrimary.head !== undefined;
			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("acc");

			const integrity = setup.accessory_integrity_img ? `-${options.worn[slot].integrity}` : '';
			const pattern = options.worn[slot].pattern && options.worn[slot].setup.pattern_layer === "secondary" ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const end = isHoodDown ? '-down' : isAltPosition ? '-alt' : '';

			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/acc${integrity}${pattern}${end}.png`;
		},
		masksrcfn(options) {
				if (options.worn.over_upper.setup.name === "kaiju costume")
					return `img/clothes/over-upper/kaiju/mask.png`;
			},
	}, overrideOptions));
}

function genlayer_clothing_detail(slot, overrideOptions) {
	return genlayer_clothing_basic(slot, Object.assign({
		z: ZIndices[slot],

		showfn(options) {
			return options.show_clothes
				&& options.worn[slot].index > 0
				&& !!options.worn[slot].pattern
				&& options.worn[slot].setup.pattern_layer === "tertiary"
				&& options.worn[slot].setup.mainImage !== 0;
		},
		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isAltPosition = !options.alt_override && setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("full");

			const pattern = options.worn[slot].pattern ? options.worn[slot].pattern?.replace(/ /g,"-") : '';

			const end = isAltPosition ? '-alt' : '';
			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/${pattern}${end}.png`;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume" && !slot.startsWith("over_"))
				return `img/clothes/over-upper/kaiju/mask.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_breasts_detail(slot, overrideOptions) {
	return genlayer_clothing_detail(slot, Object.assign({
		showfn(options) {
				let breastImg = options.worn[slot].setup.breast_acc_img;
				if (typeof breastImg === 'object' && breastImg[options.breast_size] !== null) breastImg = 1;
				return options.show_clothes && options.worn[slot].index > 0 && breastImg === 1 && !!options.worn[slot].pattern && !!options.worn[slot].setup.breast_pattern;
			},
		srcfn(options) {
			const breastImg = options.worn[slot].setup.breast_img;
			const breastAccImg = options.worn[slot].setup.breast_acc_img;
			const breastSize = typeof breastAccImg === 'object' ? breastAccImg[options.breast_size] : typeof breastImg === 'object' ? breastImg[options.breast_size] : Math.min(options.breast_size, 6);

			const pattern = options.worn[slot].pattern ? options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const folder = normaliseFileName(slot);
			return`img/clothes/${folder}/${options.worn[slot].setup.variable}/${breastSize}-${pattern}.png`;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume" && !slot.startsWith("over_"))
				return `img/clothes/over-upper/kaiju/mask.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_breasts(slot, overrideOptions) {
	return genlayer_clothing_main(slot, Object.assign({
		masksrcfn(options) {
			if (options.belly >= 19) return options.shirt_mask_breasts_src;

			const variable = options.worn[slot].setup.variable;
			const integrity = options.worn[slot].integrity;
			const folder = normaliseFileName(slot);
			if (options.worn[slot].setup.mask_img === 1) return `img/clothes/${folder}/${variable}/mask-${integrity}.png`;
			return null;
		},
		showfn(options) {
			let breastImg = options.worn[slot].setup.breast_img;
			if (typeof breastImg === 'object' && breastImg[options.breast_size] !== null) breastImg = 1;
			return options.show_clothes && options.worn[slot].index > 0 && breastImg === 1;
		},

		srcfn(options) {
			const setup = options.worn[slot].setup;
			const breastImg = setup.breast_img;

			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("breasts");

			const breastSize = typeof breastImg === 'object' ? breastImg[options.breast_size] : Math.min(options.breast_size, 6);
			const pattern = options.worn[slot].pattern && !["tertiary", "secondary"].includes(options.worn[slot].setup.pattern_layer) ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const end = isAltPosition ? '-alt' : '';
			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/${breastSize}${pattern}${end}.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_belly(slot, overrideOptions) {
	return genlayer_clothing_main(slot, Object.assign({
		z: ZIndices.bellyClothes,
		showfn(options) {
			const commonChecks = options.belly > 7
				&& options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.mainImage !== 0;

			if (slot.includes("lower")) return commonChecks && !options.belly_hides_lower;
			if (slot == "under_upper") return commonChecks;
			return commonChecks && !options.shirt_mask_clip_src;
		},
		dxfn(options) {
			if (options.belly >= 24) return 10;
			if (options.belly >= 23) return 8;
			if (options.belly >= 22) return 6;
			if (options.belly >= 19) return 4;
			if (options.belly >= 15) return 2;
			return 0;
		},

		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("full");

			const integrity = options.worn[slot].integrity;
			const end = isAltPosition ? '-alt' : '';
			const pattern = options.worn[slot].pattern && !["tertiary", "secondary"].includes(options.worn[slot].setup.pattern_layer) ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/${integrity}${pattern}${end}.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_belly_2(slot, overrideOptions) {
	return genlayer_clothing_belly(slot, Object.assign({
		dxfn(options) {
			if (options.belly >= 22) return 6;
			if (options.belly >= 19) return 4;
			if (options.belly >= 15) return 2;
			return 0;
		},
	}, overrideOptions));
}

function genlayer_clothing_belly_split(slot, overrideOptions) {
	return genlayer_clothing_belly(slot, Object.assign({
		showfn(options) {
			return options.belly > 7
				&& options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.mainImage !== 0;
		},
		dxfn(options) {
			if (options.shirt_move_right_src) return -2;
		},
	}, overrideOptions));
}

function genlayer_clothing_belly_split_acc(slot, overrideOptions) {

	return genlayer_clothing_belly(slot, Object.assign({
		filters: [`worn_${slot}_acc`],

		showfn(options) {
			return options.belly > 7
				&& options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.accessory === 1
				&& options.worn[slot].setup.mainImage !== 0;
		},
		dxfn(options) {
			if (options.shirt_move_right_src) return -2;
		},

		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isHoodDown = options.hood_down
				&& setup.hoodposition !== undefined
				&& setup.outfitPrimary.head !== undefined;
			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("acc");

			const integrity = setup.accessory_integrity_img ? `-${options.worn[slot].integrity}` : '';
			const pattern = options.worn[slot].pattern && options.worn[slot].setup.pattern_layer === "secondary" ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const end = isAltPosition ? '-alt' : '';
			const hoodDown = isHoodDown ? '-down' : end;

			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/acc${integrity}${pattern}${hoodDown}.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_belly_shadow(slot, overrideOptions) {
	return genlayer_clothing_main(slot, Object.assign({
		z: ZIndices.bellyClothesShadow,
		srcfn(options) {
			const pattern = options.worn[slot].pattern && !["tertiary", "secondary"].includes(options.worn[slot].setup.pattern_layer) ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${options.worn[slot].setup.variable}/${options.worn[slot].integrity}${pattern}.png`
		},
		showfn(options) {
			return (options.belly > 7 || (options.body_type === "soft" && !options.worn[slot].setup.outfitSecondary))
				&& options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.mainImage !== 0;
		},
		brightnessfn(options) {
			const mask = ((slot === "lower" && options.lowerShadowMask) || (slot === "under_lower" && options.underLowerShadowMask && !playerHasStrapon()))
			return between(options.belly, 8, 24) && mask ? -0.25 : options.body_type === "soft" && mask ? -0.4 : 0;
		},
		masksrcfn(options) {
			return slot === "lower" ? options.lowerShadowMask : slot === "under_lower" && !playerHasStrapon() ? options.underLowerShadowMask : ""
		}
	}, overrideOptions));
}

function genlayer_clothing_belly_acc(slot, overrideOptions) {
	return genlayer_clothing_accessory(slot, Object.assign({
		z: ZIndices[slot],

		showfn(options) {
			const commonChecks = options.belly > 7
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.accessory === 1
				&& options.worn[slot].setup.mainImage !== 0
				&& options.show_clothes;

			if (slot.includes("lower")) return commonChecks && !options.belly_hides_lower;
			if (slot.includes("upper")) return commonChecks
				&& options.worn.upper.setup.pregType != "min"
				&& !options.shirt_mask_clip_src;
			return commonChecks;
		},
		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isHoodDown = options.hood_down
				&& setup.hoodposition !== undefined
				&& setup.outfitPrimary.head !== undefined;
			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("acc");

			const integrity = setup.accessory_integrity_img ? `-${options.worn[slot].integrity}` : '';
			const pattern = options.worn[slot].pattern && options.worn[slot].setup.pattern_layer === "secondary" ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';
			const end = isAltPosition ? '-alt' : '';
			const hoodDown = isHoodDown ? '-down' : end;

			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/acc${integrity}${pattern}${hoodDown}.png`;
		},
		dxfn(options) {
			if (options.belly >= 24) return 10;
			if (options.belly >= 23) return 8;
			if (options.belly >= 22) return 6;
			if (options.belly >= 19) return 4;
			if (options.belly >= 15) return 2;
			return 0;
		},
	}, overrideOptions));
}

function genlayer_clothing_breasts_acc(slot, overrideOptions) {
	return genlayer_clothing_accessory(slot, Object.assign({
		filters: [`worn_${slot}_acc`],

		srcfn(options) {
			return getClothingPathBreastsAcc(slot, options);
		},
		showfn(options) {
			const breastAccImg = options.worn[slot].setup.breast_acc_img;
			const breastImg = options.worn[slot].setup.breast_img;
			let breastAcc = 0;

			if (breastAccImg === 1 && typeof breastImg === 'object' && breastImg[options.breast_size] !== null)
				breastAcc = 1;
			else if (typeof breastAccImg === 'object' && options.worn[slot].setup.breast_acc_img[options.breast_size] !== null)
				breastAcc = 1;

			return options.show_clothes
				&& options.worn[slot].index > 0
				&& breastAcc === 1
		},
	}, overrideOptions));
}

function genlayer_clothing_back_img(slot, overrideOptions) {
	return genlayer_clothing_basic(slot, Object.assign({
		z: ZIndices['over_head_back'],

		filtersfn(options) {
			switch (options.worn[slot].setup.back_img_colour) {
				case "none":
					return [];
				case "":
				case undefined:
				case "primary":
					return [`worn_${slot}`];
				case "secondary":
					return [`worn_${slot}_acc`];
			}
		},
		showfn(options) {
			if (!options.show_clothes) return false;

			const isHoodDown = options.hood_down
				&& options.worn[slot].setup.hood
				&& options.worn[slot].setup.outfitSecondary !== undefined;
			return options.worn[slot].index > 0 && options.worn[slot].setup.back_img === 1 && !isHoodDown;
		},
		srcfn(options) {
			const isAltPosition = !options.alt_override
				&& options.worn[slot].setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !options.worn[slot].setup.altdisabled.includes("back");

			const prefix = isAltPosition ? 'back-alt' : 'back';
			const suffix = options.worn[slot].setup.back_integrity_img ? `-${options.worn[slot].integrity}` : '';
			const pattern = options.worn[slot].pattern && !["tertiary", "secondary"].includes(options.worn[slot].setup.pattern_layer) ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';

			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${options.worn[slot].setup.variable}/${prefix}${suffix}${pattern}.png`;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume" && !slot.startsWith("over_"))
				return `img/clothes/over-upper/kaiju/mask.png`;
		},
	}, overrideOptions));
}

function genlayer_clothing_back_img_acc(slot, overrideOptions) {
	return genlayer_clothing_basic(slot, Object.assign({
		z: ZIndices['head_back'],

		filtersfn(options) {
			switch (options.worn[slot].setup.back_img_acc_colour) {
				case "none":
					return [];
				case "":
				case undefined:
				case "primary":
					return [`worn_${slot}`];
				case "secondary":
					return [`worn_${slot}_acc`]
			}
		},
		showfn(options) {
			if (!options.show_clothes) return false;

			const isHoodDown = options.hood_down
				&& options.worn[slot].setup.hood
				&& options.worn[slot].setup.outfitSecondary !== undefined;
			return options.worn[slot].index > 0 && options.worn[slot].setup.back_img_acc === 1 && !isHoodDown;
		},
		srcfn(options) {
			const isAltPosition = !options.alt_override
				&& options.worn[slot].setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !options.worn[slot].setup.altdisabled.includes("back");

			const prefix = isAltPosition ? 'back-alt' : 'back';
			const suffix = options.worn[slot].setup.back_integrity_img ? `-${options.worn[slot].integrity}` : '';
			const pattern = options.worn[slot].pattern && options.worn[slot].setup.pattern_layer === "secondary" ? "-" + options.worn[slot].pattern?.replace(/ /g,"-") : '';

			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${options.worn[slot].setup.variable}/${prefix}${suffix}${pattern}-acc.png`;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume" && !slot.startsWith("over_"))
				return `img/clothes/over-upper/kaiju/mask.png`;
		},
	}, overrideOptions));
}

/**
 * Does not setup z-index, it should be in overrideOptions
 *
 * @param {"left"|"right"} arm
 * @param {string} slot
 * @param {object?} overrideOptions
 */
function genlayer_clothing_arm(arm, slot, overrideOptions) {
	return genlayer_clothing_basic(slot, Object.assign({
		filtersfn(options) {
			return filterFnArm(options.worn[slot].setup.sleeve_colour, slot, options);
		},
		showfn(options) {
			return options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.sleeve_img === 1
				&& options[`arm_${arm}`] !== "none";
		},
		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === 'alt'
				&& !setup.altdisabled.includes('sleeves');
			const isAltSleeve = !options.alt_override
				&& options.alt_sleeve_state
				&& V.worn[slot]?.altsleeve === 'alt';

			const alt = isAltPosition ? "-alt" : '';
			const rolled = isAltSleeve ? '-rolled' : '';
			const pattern = setup.sleeve_colour === "pattern" && options.worn[slot].pattern ? `-${options.worn[slot].pattern?.replace(/ /g,"-")}` : '';
			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/${arm}-${options[`arm_${arm}`]}${alt}${pattern}${rolled}.png`;
		},
	}, overrideOptions));
}

/**
 * Does not setup z-index, it should be in overrideOptions
 *
 * @param {"left"|"right"} arm
 * @param {string} slot
 * @param {object?} overrideOptions
 */
function genlayer_clothing_arm_fitted(arm, slot, overrideOptions) {
	return genlayer_clothing_arm(arm, slot, Object.assign({
		showfn(options) {
			return options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.sleeve_img === 1
				&& ["curvy", "slender"].includes(options.body_type)
				&& options.arm_left === "idle"
				&& !(options.belly > 7)
				&& options["arm_" + arm] !== "none";
		},
		masksrcfn(options) {
			return options[`${slot}_fitted_left_move_src`];
		},
		dxfn() {
			return -2;
		},
	}, overrideOptions));
}

/**
 * Does not setup z-index, it should be in overrideOptions
 *
 * @param {"left"|"right"} arm
 * @param {string} slot
 * @param {object?} overrideOptions
 */
function genlayer_clothing_arm_acc(arm, slot, overrideOptions) {
	return genlayer_clothing_basic(slot, Object.assign({
		filtersfn(options) {
			return filterFnArm(options.worn[slot].setup.accessory_colour_sidebar, slot, options);
		},
		showfn(options) {
			return options.worn[slot].index > 0
				&& options.worn[slot].setup.sleeve_acc_img === 1
				&& options[`arm_${arm}`] !== "none";
		},
		srcfn(options) {
			const setup = options.worn[slot].setup;

			const isAltPosition = !options.alt_override
				&& setup.altposition !== undefined
				&& options.worn[slot].alt === "alt"
				&& !setup.altdisabled.includes("sleeves")
				&& !setup.altdisabled.includes("sleeve_acc");

			let filename = `${arm}-${options[`arm_${arm}`]}`;
			filename += (isAltPosition) ? '-alt-acc' : '-acc';

			const folder = normaliseFileName(slot);
			return `img/clothes/${folder}/${setup.variable}/${filename}.png`;
		},
	}, overrideOptions));
}

/**
 * Does not setup z-index, it should be in overrideOptions
 *
 * @param {"left"|"right"} arm
 * @param {string} slot
 * @param {object?} overrideOptions
 */
function genlayer_clothing_arm_acc_fitted(arm, slot, overrideOptions) {
	return genlayer_clothing_arm_acc(arm, slot, Object.assign({
		showfn(options) {
			return options.show_clothes
				&& options.worn[slot].index > 0
				&& options.worn[slot].setup.sleeve_img === 1
				&& options.worn[slot].setup.sleeve_acc_img === 1
				&& ["curvy", "slender"].includes(options.body_type)
				&& options.arm_left === "idle"
				&& !(options.belly > 7)
				&& !(options.worn.under_upper.setup.formfittingDisabled ?? []).includes("sleeve_acc")
				&& options[`arm_${arm}`] !== "none";
		},
		masksrcfn(options) {
			return options[`${slot}_fitted_left_move_src`];
		},
		dxfn() {
			return -2;
		},
	}, overrideOptions))
}

function genlayer_tanning(slot, index, tanningLayer, value, animation = "idle") {
	return {
		alphafn() {
			return value / 100;
		},
		animation,
		blendMode: "multiply",
		filters: ["body"],
		showfn(options) {
			return V.options.tanLines
				&& options.tanningEnabled
				&& !options.mannequin
				&& options.skin_type !== "custom"
				&& this.model.layers[slot].show;
		},
		masksrcfn() {
			return tanningLayer;
		},
		srcfn(options) {
			// Clear from cache and reload if src has been changed
			if (this.model.layers[slot].src !== options.generatedLayers[`tan_${slot}${index}`].src) {
				delete Renderer.ImageCaches[this.model.layers[slot].src];
			}
			return this.model.layers[slot].src;
		},
		zfn() {
			return this.model.layers[slot].z;
		},
	};
}

function genlayer_tf(tf, folder, part, overrideOptions) {
	return Object.assign({
		filters: ["hair"],
		z: ZIndices.lower,
		animation: "idle",

		srcfn(options) {
			if (folder !== part) return `img/transformations/${tf}/${folder}/${part}-${options[`${tf}_${part}_type`]}.png`;
			return `img/transformations/${tf}/${folder}/${options[`${tf}_${part}_type`]}.png`;
		},
		showfn(options) {
			return options.show_tf
			&& isPartEnabled(options[`${tf}_${part}_type`])
			&& !options.hide_all;
		},
	}, overrideOptions);
}

function genlayer_wings(side, tf, hair, overrideOptions) {
	return Object.assign({
		animation: "idle",
		filters: hair ? ["hair"] : [],
		srcfn(options) {
			const state = `${options[`${tf}_wing_${side}`]}`;
			const cover = state === "cover" ? `-${side}` : "";
			return `img/transformations/${tf}/wings-${state}/${options[`${tf}_wings_type`]}${cover}.png`;
		},
		showfn(options) {
			return options.show_tf
				&& isPartEnabled(`${options[`${tf}_wings_type`]}`)
				&& !options.hide_all;
		},
		zfn(options) {
			if (`${options[`${tf}_wing_${side}`]}` === "cover") return ZIndices.tailPenisCover;
			if (`${options[`${tf}_wings_layer`]}` === "back") return ZIndices.over_head_back;
			return ZIndices.backhair;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume")
				return `img/clothes/over-upper/kaiju/mask.png`;
			const state = `${options[`${tf}_wing_${side}`]}`;
			if (state !== "cover") return `img/face/masks/${side}.png`;
		},
	}, overrideOptions);
}

function genlayer_halo(side, tf, overrideOptions) {
	return Object.assign({
		animation: "idle",
		srcfn(options) {
			return `img/transformations/${tf}/halo/${options[`${tf}_halo_type`]}-${side}.png`;
		},
		showfn(options) {
			return options.show_tf
				&& isPartEnabled(options[`${tf}_halo_type`])
				&& !options.hide_all;
		},
		dyfn(options) {
			return options.angel_halo_lower && isPartEnabled(options.angel_halo_type) ? 15 : 0;
		},
		zfn(options) {
			if (side === "back") {
				return options.angel_halo_lower && isPartEnabled(options.angel_halo_type) ? ZIndices.head_back : ZIndices.over_head_back;
			};
			return options.angel_halo_lower && isPartEnabled(options.angel_halo_type) ? ZIndices.over_head : ZIndices.old_over_upper;
		},
	}, overrideOptions);
}

function genlayer_tail(tf, hair, overrideOptions) {
	return genlayer_tf(tf, "tail", "tail", Object.assign({
		z: ZIndices.tailPenisCover,
		filters: hair ? ["hair"] : [],

		srcfn(options) {
			const demon = tf === "demon" || isChimeraEnabled("demoncow", "tail") || isChimeraEnabled("demoncat", "tail") || isChimeraEnabled("demonwolf", "tail") || isChimeraEnabled("demonfox", "tail");
			const tail = demon ? `tail-${options.demon_tail_state}` : "tail-idle";

			return `img/transformations/${tf}/${tail}/${options[`${tf}_tail_type`]}.png`;
		},
		zfn(options) {
			const cover = ["cover", "flaunt"].includes(options.demon_tail_state) && (tf === "demon" || isChimeraEnabled("demoncow", "tail") || isChimeraEnabled("demoncat", "tail") || isChimeraEnabled("demonwolf", "tail") || isChimeraEnabled("demonfox", "tail"));
			if (cover) return ZIndices.tailPenisCover;
			if (options[`${tf}_tail_layer`] === "back") return ZIndices.tail;
			return ZIndices.back_lower;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume")
				return `img/clothes/over-upper/kaiju/mask.png`;
		},
	}, overrideOptions))
}

function genlayer_cheeks(tf, overrideOptions) {
	return genlayer_tf(tf, "cheeks", "cheeks", Object.assign({
		filters: ["hair"],
		z: ZIndices.lower,
	}, overrideOptions))
}

function genlayer_tf_pubes(tf, folder, overrideOptions) {
	return genlayer_tf(tf, folder, "pubes", Object.assign({
		z: ZIndices.hirsute,
		showfn(options) {
			return options.show_tf
			&& isPartEnabled(options[`${tf}_pubes_type`])
			&& !options.belly_hides_under_lower
			&& !options.hide_all;
		},
		masksrcfn(options) {
			return options.body_type === "soft" ? "img/clothes/masks/soft-lower-clip.png" : null;
		},
	}, overrideOptions))
}

function genlayer_tf_pits(tf, folder, overrideOptions) {
	return genlayer_tf(tf, folder, "pits", Object.assign({
		z: ZIndices.hirsute,
		showfn(options) {
			return options.show_tf
			&& isPartEnabled(options[`${tf}_pits_type`])
			&& !options.hide_all;
		},
	}, overrideOptions))
}

function genlayer_ears(tf, hair, overrideOptions) {
	return genlayer_tf(tf, "ears", "ears", Object.assign({
		filters: hair ? ["hair"] : [],

		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume")
				return `img/clothes/over-upper/kaiju/mask.png`;
			if (!options.hideHeadAcc) return options.headMask;
		},

		zfn(options) {
			if (options.hideHeadAcc) {
				return ZIndices.over_head;
			}
			return options.tf_ears_layer === "front" ? ZIndices.front_hair +1 : ZIndices.basehead;
		}
	}, overrideOptions))
}

function genlayer_horns(tf, overrideOptions) {
	return genlayer_tf(tf, "horns", "horns", Object.assign({
		filters: [],
		animation: "idle",
		zfn(options) {
			return options[`${tf}_horns_layer`] === "front" ? ZIndices.over_head : ZIndices.horns;
		},
		masksrcfn(options) {
			if (options.worn.over_upper.setup.name === "kaiju costume")
				return `img/clothes/over-upper/kaiju/mask.png`;
			return options[`${tf}_horns_layer`] !== "front" ? options.headMask : null;
		},
	}, overrideOptions))
}


function setClothingFilter(options, slot, clothingObject, setupObj, filterSuffix, colourProp, customProp) {
	const filterType = `worn_${slot}${filterSuffix}`;
	const colour = clothingObject[customProp];

	options.filters[filterType] = (setupObj[colourProp])
		? lookupColour(
			options,
			setup.colours.clothes_map,
			colour,
			`${slot} ${filterSuffix.includes('_acc') ? 'accessory' : 'clothing'}`,
			`${filterType}_custom`,
			setupObj.prefilter
		)
		: Renderer.emptyLayerFilter();
}

function makeupAdjustment(options) {
	let limit = [0, -0.1];
	switch (options.skin_type) {
		case "medium":
		case "rmedium":
		case "ymedium":
		case "gmedium":
		case "bmedium":
			limit = [-0.1, -0.3];
			break;
		case "dark":
		case "rdark":
		case "ydark":
		case "gdark":
		case "bdark":
			limit = [-0.3, -0.4];
			break;
		case "gyaru":
		case "rgyaru":
		case "ygyaru":
		case "ggyaru":
		case "bgyaru":
			limit = [0, -0.2];
			break;
		default:
	}
	const [min, max] = limit;
	const ratio = options.skin_tone / 100;
	options.makeup_adjustment = min + (max - min) * ratio;
}

/* eslint-disable no-undef */
/* eslint-disable eqeqeq */
DefineMacro("modelprepare-player-body", function () {
	T.disabled = ["disabled", "hidden"];
	T.modeloptions.skin_type = Skin.color.natural;
	T.modeloptions.skin_tone = Skin.color.tan;

	if (V.makeup.eyeshadow != 0) {
		T.modeloptions.eyeshadow_colour = V.makeup.eyeshadow;
	}
	if (V.makeup.mascara != 0) {
		T.modeloptions.mascara_colour = V.makeup.mascara;
	}
	if (V.makeup.mascara_running != 0) {
		T.modeloptions.mascara_running = V.makeup.mascara_running;
	}
	if (V.makeup.lipstick != 0) {
		T.modeloptions.lipstick_colour = V.makeup.lipstick;
	}
	if (V.makeup.blusher != 0) {
		T.modeloptions.blusher_colour = V.makeup.blusher;
	}

	if (V.possessed) {
		T.modeloptions.left_eye = ["haunt", "despair"].includes(V.wraith.state) ? "red possessed" : "blue possessed";
		T.modeloptions.right_eye = ["haunt", "despair"].includes(V.wraith.state) ? "red possessed" : "blue possessed";
	} else {
		T.modeloptions.left_eye = V.makeup.eyelenses.left != 0 ? V.makeup.eyelenses.left : V.leftEyeColour;
		T.modeloptions.right_eye = V.makeup.eyelenses.right != 0 ? V.makeup.eyelenses.right : V.rightEyeColour;
	}

	T.modeloptions.hair_colour = V.haircolour.replace(" ", "");
	T.modeloptions.hair_fringe_colour = V.hairfringecolour.replace(" ", "");
	T.modeloptions.hair_colour_gradient = V.hairColourGradient;
	T.modeloptions.hair_fringe_colour_gradient = V.hairFringeColourGradient;
	T.modeloptions.hair_colour_style = V.hairColourStyle;
	T.modeloptions.hair_fringe_colour_style = V.hairFringeColourStyle;

	T.modeloptions.brows_colour = (V.makeup.browscolour != 0 ? V.makeup.browscolour : V.naturalhaircolour).replace(" ", "");
	T.modeloptions.pbhair_colour = (V.makeup.pbcolour != 0 ? V.makeup.pbcolour : V.naturalhaircolour).replace(" ", "");

	/*
			██████   █████  ███████ ███████
			██   ██ ██   ██ ██      ██
			██████  ███████ ███████ █████
			██   ██ ██   ██      ██ ██
			██████  ██   ██ ███████ ███████
		*/

	T.modeloptions.body_type = V.player.bodyshape || { a: "slender", f: "curvy" }[V.player.gender_body] || "classic";

	apparentbreastsizecheck();
	const breastSizeMap = {
		12: 6,
		8: 5,
		9: 5,
		10: 5,
		11: 5,
		6: 4,
		7: 4,
		4: 3,
		5: 3,
		3: 2,
		1: 1,
		2: 1,
	};

	T.modeloptions.breast_size = breastSizeMap[V.player.perceived_breastsize] || 0;
	T.modeloptions.breasts = "default";

	if (V.sexStats) {
		const bellySize = playerBellySize() || V.bellySizeDebug;
		T.modeloptions.belly = bellySize;
		T.bellySize = bellySize;
	}

	if (V.wraithSkin) {
		T.modeloptions.skin_type = "wraith";
		T.modeloptions.filters = {
			tan: {
				blend: "#ffffff",
				blendMode: "multiply",
				desaturate: true,
			},
		};
		T.modeloptions.tanningEnabled = false;
	}

	T.modeloptions.tummy_parasite = V.parasite.tummy.name;

	/*
			██   ██  █████  ██ ██████
			██   ██ ██   ██ ██ ██   ██
			███████ ███████ ██ ██████
			██   ██ ██   ██ ██ ██   ██
			██   ██ ██   ██ ██ ██   ██
		*/

	T.modeloptions.hair_sides_length = V.hairlengthstage;
	const hairstyle = setup.hairstyles.sides.find(hs => hs.variable === V.hairtype);

	if (hairstyle.alt_head_type && hairstyle.alt_head_type.includes(setup.clothes.head[clothesIndex("head", V.worn.head)].head_type)) {
		T.modeloptions.hair_sides_type = hairstyle.alt;
	} else {
		T.modeloptions.hair_sides_type = V.hairtype;
	}

	T.modeloptions.hair_sides_position = V.hairposition;
	T.modeloptions.hair_fringe_length = V.fringelengthstage;
	T.modeloptions.hair_fringe_type = V.fringetype;

	/*
			█████  ██████  ███    ███ ███████
			██   ██ ██   ██ ████  ████ ██
			███████ ██████  ██ ████ ██ ███████
			██   ██ ██   ██ ██  ██  ██      ██
			██   ██ ██   ██ ██      ██ ███████
			*/
	const wings = ["demon", "angel", "fallenAngel", "bird"].some(tf => !["hidden", "disabled"].includes(V.transformationParts[tf].wings));
	const coverBreasts = !V.dontHide && ((V.uncomfortable.nude && T.exposedUpper >= 2) || (V.uncomfortable.underwear && T.exposedUpper >= 1));
	const coverCrotch = !V.dontHide && ((V.uncomfortable.nude && T.exposedLower >= 2) || (V.uncomfortable.underwear && T.exposedLower >= 1));

	T.modeloptions.arm_left = armPosition("left");
	T.modeloptions.arm_right = armPosition("right");

	if (coverBreasts) {
		if (wings) {
			if (
				!T.disabled.includes(V.transformationParts.demon.wings) &&
				!(isChimeraEnabled("demonharpy", "wings") && isPartEnabled(T.modeloptions.bird_wings_type))
			) {
				T.modeloptions.demon_wings_state = V.transformationParts.traits.flaunting === "default" ? "flaunt" : "cover";
			} else if (!T.disabled.includes(V.transformationParts.angel.wings)) {
				T.modeloptions.angel_wing_right = "cover";
				T.modeloptions.bird_wing_right = "cover";
			} else if (!T.disabled.includes(V.transformationParts.fallenAngel.wings)) {
				T.modeloptions.fallen_wing_right = "cover";
				T.modeloptions.bird_wing_right = "cover";
			} else if (!T.disabled.includes(V.transformationParts.bird.wings)) {
				T.modeloptions.bird_wing_right = "cover";
			}
		} else {
			T.coverBreastsWithArm = true;
		}
	}

	if (coverCrotch && wings) {
		if (!T.disabled.includes(V.transformationParts.demon.tail)) {
			T.modeloptions.demon_tail_state = V.transformationParts.traits.flaunting === "default" ? "flaunt" : "cover";
			if (!T.disabled.includes(V.transformationParts.cat.tail)) T.modeloptions.cat_tail_state = "cover";
		} else if (!T.disabled.includes(V.transformationParts.angel.wings)) {
			T.modeloptions.angel_wing_left = "cover";
			T.modeloptions.bird_wing_left = "cover";
		} else if (!T.disabled.includes(V.transformationParts.fallenAngel.wings)) {
			T.modeloptions.fallen_wing_left = "cover";
			T.modeloptions.bird_wing_left = "cover";
		} else if (!T.disabled.includes(V.transformationParts.bird.wings)) {
			T.modeloptions.bird_wing_left = "cover";
		}
	}

	if (T.prop) {
		T.modeloptions.prop = {};
		T.modeloptions.prop = Object.assign({}, T.prop);
		T.modeloptions.prop.show =
			(T.modeloptions.arm_left !== "none" && T.modeloptions.arm_right !== "none") || T.modeloptions.prop.armPosition === "handsfree";
		if (coverCrotch && T.prop.hasCoverImg && !wings) T.modeloptions.prop.name += "-cover";
	}

	function armPosition(arm) {
		if (["grappled", "bound"].includes(V[arm + "arm"])) return "none";

		if (T.prop) {
			if (propCoversNudity(arm)) return "cover";

			if (T.prop.armPosition === "clutch") return arm === "right" ? "hold" : "cover";
			if (T.prop.armPosition === `${arm}_cover` || T.prop.armPosition === "cover_both") return "cover";
			if (T.prop.armPosition === `${arm}_hold`) return "hold";
		}

		if (useCover(arm)) return "cover";
		if (useHold(arm)) return "hold";

		return "idle";
	}

	function propCoversNudity(arm) {
		if (wings || !T.prop.hasCoverImg) return false;

		if (arm === "right" && coverCrotch && !T.prop.armPosition.includes("left")) return true;
		if (arm === "left" && coverBreasts && (T.prop.armPosition.includes("left") || T.prop.armPosition === "idle_both")) return true;
		return false;
	}

	function useCover(arm) {
		const leftCoverClothes = setup.clothes_all_slots.some(slot => ["left_cover", "clutch", "cover_both"].includes(V.worn[slot]?.holdPosition));
		const rightCoverClothes = setup.clothes_all_slots.some(slot => ["right_cover", "cover_both"].includes(V.worn[slot]?.holdPosition));

		if ((arm === "left" && leftCoverClothes) || (arm === "right" && rightCoverClothes)) return true;
		if (!wings && ((arm === "left" && coverBreasts) || (arm === "right" && coverCrotch))) return true;
		return false;
	}

	function useHold(arm) {
		const rightHoldClothes =
			setup.clothes_all_slots.some(slot => ["right_hold", "clutch"].includes(V.worn[slot]?.holdPosition)) ||
			(V.worn.handheld.name !== "naked" && !["left_cover", "left_idle", "idle_both"].includes(V.worn.handheld?.holdPosition));
		const leftHoldClothes = setup.clothes_all_slots.some(slot => V.worn[slot]?.holdPosition === "left_hold");

		if ((arm === "right" && rightHoldClothes) || (arm === "left" && leftHoldClothes)) return true;
		return false;
	}

	/*
			██     ██ ██████  ██ ████████ ██ ███    ██  ██████  ███████
			██     ██ ██   ██ ██    ██    ██ ████   ██ ██       ██
			██  █  ██ ██████  ██    ██    ██ ██ ██  ██ ██   ███ ███████
			██ ███ ██ ██   ██ ██    ██    ██ ██  ██ ██ ██    ██      ██
			 ███ ███  ██   ██ ██    ██    ██ ██   ████  ██████  ███████
		*/

	if (V.options.bodywritingImages === true) {
		for (const [label, value] of Object.entries(V.skin)) {
			if (value.writing) {
				T.modeloptions["writing_" + label] = setup.bodywriting_namebyindex[value.index];
			}
		}
	}

	/*
			███████  █████   ██████ ███████
			██      ██   ██ ██      ██
			█████   ███████ ██      █████
			██      ██   ██ ██      ██
			██      ██   ██  ██████ ███████
		*/

	T.modeloptions.facestyle = V.facestyle || "default";
	T.modeloptions.facevariant = V.facevariant || "default";
	T.modeloptions.freckles = V.player.freckles === true && V.makeup.concealer !== 1;
	T.modeloptions.ears_position = V.earsposition;
	T.modeloptions.toast = T.toast === true;
	T.modeloptions.scars = false;

	// Eyes
	if (V.possessed) {
		T.modeloptions.trauma = V.possessed;
	} else {
		T.modeloptions.trauma = V.trauma >= V.traumamax * 0.9;
	}
	T.modeloptions.blink = V.options.blinkingEnabled;
	T.modeloptions.eyes_bloodshot = (V.pain >= 100 && V.willpowerpain === 0) || V.tiredness >= C.tiredness.max;
	T.modeloptions.eyes_half =
		(V.options.halfClosedEnabled &&
			(V.arousal >= (V.arousalmax / 5) * 4 || V.orgasmdown >= 1) &&
			V.trauma < V.traumamax * 0.9 &&
			V.pain < 60 &&
			V.eyelidTEST === true) ||
		V.possessed ||
		V.tiredness >= C.tiredness.max * 0.75;

	// Brows
	if (V.trauma >= V.traumamax || V.possessed) {
		T.modeloptions.brows = "top";
	} else if (V.pain >= 60) {
		T.modeloptions.brows = "low";
	} else if (V.arousal >= (V.arousalmax / 5) * 4 || V.orgasmdown >= 1) {
		T.modeloptions.brows = "orgasm";
	} else if (V.pain >= 20) {
		T.modeloptions.brows = "mid";
	} else {
		T.modeloptions.brows = "top";
	}
	T.modeloptions.brows_position = V.browsposition;

	// Mouth
	if (V.underwater === 1 || (T.tempEffects?.underwater && T.tempEffects.underwater !== "noMouth")) {
		T.modeloptions.mouth = "chew";
	} else if (V.trauma >= V.traumamax) {
		T.modeloptions.mouth = "neutral";
	} else if (V.pain >= 60 || V.orgasmdown >= 1 || V.possessed) {
		T.modeloptions.mouth = "cry";
	} else if ((V.exposed === 2 && V.uncomfortable.nude === true && V.dontHide === false && V.libertine !== 2) || V.pain >= 20) {
		T.modeloptions.mouth = "frown";
	} else if (V.pain >= 1 || (V.exposed === 1 && V.uncomfortable.underwear === true) || (V.combat === 1 && V.consensual !== 1)) {
		T.modeloptions.mouth = "neutral";
	} else if (V.stress >= (V.stressmax / 5) * 3 || !(V.control >= (V.controlmax / 5) * 1)) {
		T.modeloptions.mouth = "neutral";
	} else {
		T.modeloptions.mouth = "smile";
	}
	if (T.prop?.folder === "food" && !T.prop.name.includes("gift")) {
		const foodKey = T.prop.name
			.replace(/-/g, "_")
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "");
		const category = setup.foodstuff[foodKey]?.category;
		const shouldChew = (category ? category !== "dish" : true) && !T.prop.name.includes("inedible");
		if (shouldChew) T.modeloptions.mouth = "chew";
	}

	// Blush
	T.modeloptions.blush = Math.min(5, Math.floor(V.arousal / 2000) + 1);
	if (T.modeloptions.blush < 2 && V.exposed >= 2) {
		T.modeloptions.blush = 2;
	} else if (V.arousal < 100 && V.exposed < 1) {
		T.modeloptions.blush = 0;
	}
	if (
		T.modeloptions.blush < 2 &&
		!V.worn.over_upper.type.includes("naked") &&
		!V.worn.over_lower.type.includes("naked") &&
		V.worn.upper.type.includes("naked") &&
		V.worn.lower.type.includes("naked") &&
		V.worn.under_upper.type.includes("naked") &&
		V.worn.under_lower.type.includes("naked")
	) {
		T.modeloptions.blush = 2;
	}

	// Tears
	T.modeloptions.tears = painToTearsLvl(V.pain);

	/*
		 ████████ ███████ ███████
			██    ██      ██
			██    █████   ███████
			██    ██           ██
			██    ██      ███████
		*/

	// Wing and tail idle/cover/flaunt state is configured in the arms section above

	T.modeloptions.angel_wings_type = V.transformationParts.angel.wings;
	T.modeloptions.angel_wings_layer = V.wingslayer;
	T.modeloptions.angel_halo_type = V.transformationParts.angel.halo;

	T.modeloptions.fallen_wings_type = V.transformationParts.fallenAngel.wings;
	T.modeloptions.fallen_wings_layer = V.wingslayer;
	T.modeloptions.fallen_halo_type = V.transformationParts.fallenAngel.halo;

	T.modeloptions.demon_wings_type = V.transformationParts.demon.wings;
	T.modeloptions.demon_wings_layer = V.wingslayer;
	T.modeloptions.demon_tail_type = V.transformationParts.demon.tail;
	T.modeloptions.demon_tail_layer = V.taillayer;
	T.modeloptions.demon_horns_type = V.transformationParts.demon.horns;
	T.modeloptions.demon_horns_layer = V.hornslayer;

	T.modeloptions.wolf_tail_type = V.transformationParts.wolf.tail;
	T.modeloptions.wolf_tail_layer = V.taillayer;
	T.modeloptions.wolf_ears_type = V.transformationParts.wolf.ears;
	T.modeloptions.wolf_pits_type = V.transformationParts.wolf.pits;
	T.modeloptions.wolf_pubes_type = V.transformationParts.wolf.pubes;
	T.modeloptions.wolf_cheeks_type = V.transformationParts.wolf.cheeks;

	T.modeloptions.cat_tail_type = V.transformationParts.cat.tail;
	T.modeloptions.cat_tail_layer = V.taillayer;
	T.modeloptions.cat_ears_type = V.transformationParts.cat.ears;

	T.modeloptions.cow_horns_type = V.transformationParts.cow.horns;
	T.modeloptions.cow_horns_layer = V.hornslayer;
	T.modeloptions.cow_tail_type = V.transformationParts.cow.tail.replace(/ /g, "-");
	T.modeloptions.cow_tail_layer = V.taillayer;
	T.modeloptions.cow_ears_type = V.transformationParts.cow.ears.replace(/ /g, "-");

	T.modeloptions.bird_wings_type = V.transformationParts.bird.wings;
	T.modeloptions.bird_wings_layer = V.wingslayer;
	T.modeloptions.bird_tail_type = V.transformationParts.bird.tail;
	T.modeloptions.bird_tail_layer = V.taillayer;
	T.modeloptions.bird_eyes_type = V.transformationParts.bird.eyes;
	T.modeloptions.bird_malar_type = V.transformationParts.bird.malar;
	T.modeloptions.bird_plumage_type = V.transformationParts.bird.plumage;
	T.modeloptions.bird_pubes_type = V.transformationParts.bird.pubes;

	T.modeloptions.fox_tail_type = V.transformationParts.fox.tail;
	T.modeloptions.fox_tail_layer = V.taillayer;
	T.modeloptions.fox_ears_type = V.transformationParts.fox.ears;
	T.modeloptions.fox_cheeks_type = V.transformationParts.fox.cheeks;

	T.modeloptions.tf_ears_layer = V.tfearslayer;

	/*
			██████ ██   ██ ██ ███    ███ ███████ ██████   █████
			██      ██   ██ ██ ████  ████ ██      ██   ██ ██   ██
			██      ███████ ██ ██ ████ ██ █████   ██████  ███████
			██      ██   ██ ██ ██  ██  ██ ██      ██   ██ ██   ██
			██████ ██   ██ ██ ██      ██ ███████ ██   ██ ██   ██
		*/

	// Demon-cat tail
	if (isPartEnabled(T.modeloptions.cat_tail_type) && isPartEnabled(T.modeloptions.demon_tail_type) && isChimeraEnabled("demoncat", "tail")) {
		T.modeloptions.demon_tail_type = "default-cat";
		T.modeloptions.demon_tail_layer = "cover";
	}
	// Demon-harpy wings
	if (isPartEnabled(T.modeloptions.demon_wings_type) && isPartEnabled(T.modeloptions.bird_wings_type) && isChimeraEnabled("demonharpy", "wings")) {
		T.modeloptions.bird_wings_type = "default-demon";
		T.modeloptions.demon_wings_type = "hidden";
	}
	// Angel-harpy wings
	if (isPartEnabled(T.modeloptions.angel_wings_type) && isPartEnabled(T.modeloptions.bird_wings_type) && isChimeraEnabled("angelharpy", "wings")) {
		T.modeloptions.bird_wings_type = "default-angel";
		T.modeloptions.angel_wings_type = "harpy-default";
	}
	// Fallen angel-harpy wings
	if (isPartEnabled(T.modeloptions.fallen_wings_type) && isPartEnabled(T.modeloptions.bird_wings_type) && isChimeraEnabled("fallenharpy", "wings")) {
		T.modeloptions.bird_wings_type = V.transformationParts.fallenAngel.wings.includes("fallenplus") ? "default-angel" : "default-fallen";
		T.modeloptions.fallen_wings_type = T.modeloptions.fallen_wings_type.includes("fallenplus") ? "harpy-fallenplus" : "harpy-default";
	}
	// Demon-cow horns
	if (isPartEnabled(T.modeloptions.cow_horns_type) && isPartEnabled(T.modeloptions.demon_horns_type) && isChimeraEnabled("demoncow", "horns")) {
		if (!["default", "succubus"].includes(T.modeloptions.demon_horns_type)) {
			// Force default horns if the PC has unsupported horn styles (e.g. Classic)
			T.modeloptions.demon_horns_type = "default";
		}
		T.modeloptions.cow_horns_type = T.modeloptions.demon_horns_type === "succubus" ? "succubus-demon" : "default-demon";
	}
	// Demon-cow tail
	if (isPartEnabled(T.modeloptions.cow_tail_type) && isPartEnabled(T.modeloptions.demon_tail_type) && isChimeraEnabled("demoncow", "tail")) {
		T.modeloptions.demon_tail_type = "default-cow";
		T.modeloptions.cow_tail_type = T.modeloptions.cow_tail_type + "-demon";
	}
	// Demon-wolf tail
	if (isPartEnabled(T.modeloptions.wolf_tail_type) && isPartEnabled(T.modeloptions.demon_tail_type) && isChimeraEnabled("demonwolf", "tail")) {
		T.modeloptions.demon_tail_type = T.modeloptions.wolf_tail_type === "feral" ? "default-feral" : "default-wolf";
		T.modeloptions.wolf_tail_type = T.modeloptions.wolf_tail_type === "feral" ? "demon-feral" : "demon-default";
	}
	// Demon-fox tail
	if (isPartEnabled(T.modeloptions.fox_tail_type) && isPartEnabled(T.modeloptions.demon_tail_type) && isChimeraEnabled("demonfox", "tail")) {
		T.modeloptions.fox_tail_type = "default-demon";
		T.modeloptions.demon_tail_type = "hidden";
	}
	// Demon-fox ears
	if (isPartEnabled(T.modeloptions.fox_ears_type) && V.demon >= 6 && isChimeraEnabled("demonfox", "ears")) {
		T.modeloptions.fox_ears_type = "default-demon";
	}

	/*
			██████ ██████   ██████  ████████  ██████ ██   ██
			██      ██   ██ ██    ██    ██    ██      ██   ██
			██      ██████  ██    ██    ██    ██      ███████
			██      ██   ██ ██    ██    ██    ██      ██   ██
			██████ ██   ██  ██████     ██     ██████ ██   ██
		*/

	T.modeloptions.crotch_visible = true;

	if (V.settings.pubicHairEnabled === true) {
		T.modeloptions.pbhair_level = V.pblevel;
		T.modeloptions.pbhair_strip = V.pbstrip;
		T.modeloptions.pbhair_balls = V.pblevelballs;
	}

	if (V.player.penisExist) {
		T.modeloptions.penis_size = Math.clamp(V.player.penissize, 0, 6);
		T.modeloptions.balls = V.player.ballsExist;
		T.modeloptions.penis_condom = V.player.condom.type;
		T.modeloptions.condom_colour = V.player.condom.colour;
		const flaccid = V.arousal < 6000 ? "soft" : "hard";
		const virgin = V.player.virginity.penile === true ? "-virgin-" : "-";
		T.modeloptions.penis = flaccid + virgin + T.modeloptions.penis_size;

		if (V.parasite.penis.name || V.parasite.clit.name === "parasite") {
			/* ear-slime */
			if (V.parasite.penis.name === "parasite" || V.parasite.clit.name === "parasite") {
				T.modeloptions.ear_slime_size = V.player.penissize;
				if (V.worn.genitals.name === "chastity parasite") {
					switch (V.player.penissize) {
						case 2:
							T.modeloptions.ear_slime_size = 1;
							break;
						case 3:
						case 4:
							T.modeloptions.ear_slime_size = 2;
							break;
						case 5:
						case 6:
							T.modeloptions.ear_slime_size = 3;
							break;
						default:
							T.modeloptions.ear_slime_size = 0;
							break;
					}
				}
				T.modeloptions.penis_parasite = `ear-slime-${T.modeloptions.ear_slime_size}`;
			} else {
				/* slime, urchin */
				T.modeloptions.penis_parasite = V.parasite.penis.name;
				if (playerChastity("cage")) {
					/* slime-cage.png, urchin-cage.png */
					T.modeloptions.penis_parasite += "-cage";
					if (V.worn.genitals.name !== "chastity cage") {
						/* slime-cage-fetish.png, slime-cage-small.png, slime-cage-flat.png, etc. */
						const cageType = V.worn.genitals.name.replace(" chastity cage", "");
						T.modeloptions.penis_parasite += `-${cageType}`;
					}
				} else {
					/* slime-hard-3.png, urchin-hard-2.png, etc. */
					T.modeloptions.penis_parasite += `-${flaccid}-${V.player.penissize}`;
				}
			}
		}
	}

	if (V.player.vaginaExist && V.parasite.penis.name && V.parasite.penis.name !== "parasite") {
		/* slime-clit.png, urchin-clit.png */
		T.modeloptions.clit_parasite = V.parasite.clit.name;
	}

	/* ear slime parasite */
	if (V.parasite.penis.name === "parasite" || V.parasite.clit.name === "parasite") {
		if (V.earSlime.focus === "impregnation") {
			T.modeloptions.ear_slime_panties = "ear-slime-shorts";
		} else {
			T.modeloptions.ear_slime_panties = "ear-slime-panties";
		}

		// Ensure it's always displayed
		if (V.worn.genitals.name === "chastity parasite") {
			T.modeloptions.worn = T.modeloptions.worn || {};
			T.modeloptions.worn.genitals = {
				index: clothesIndex("genitals", V.worn.genitals),
				integrity: integrityKeyword(V.worn.genitals, "genitals"),
				colour: V.worn.genitals.colour,
			};
		}
	}

	// Dripping Speeds
	const dripspeeds = ["", "start", "very-slow", "slow", "fast", "very-fast"];

	// Vagina
	let _liquidamt = Math.clamp(setup.bodyliquid.combined("vagina"), 0, 5);
	T.modeloptions.drip_vaginal = dripspeeds[_liquidamt];

	// Anus
	_liquidamt = Math.clamp(setup.bodyliquid.combined("anus"), 0, 5);
	T.modeloptions.drip_anal = dripspeeds[_liquidamt];

	// Mouth
	_liquidamt = Math.clamp(setup.bodyliquid.combined("mouth"), 0, 5);
	T.modeloptions.drip_mouth = dripspeeds[_liquidamt];

	let _chestVisible = false;
	if (V.worn.upper.exposed >= 2 && V.worn.under_upper.exposed >= 1) {
		_chestVisible = true;
	} else if ((V.upperwetstage > 0 || V.worn.upper.type.includes("naked")) && (V.underupperwetstage > 0 || V.worn.under_upper.type.includes("naked"))) {
		_chestVisible = true;
	}

	if (_chestVisible) {
		T.modeloptions.nipples_parasite = V.parasite.nipples.name;
		T.modeloptions.breasts_parasite = V.parasite.breasts.name;
	}

	/*
			███████ ██      ██    ██ ██ ██████  ███████
			██      ██      ██    ██ ██ ██   ██ ██
			█████   ██      ██    ██ ██ ██   ██ ███████
			██      ██      ██    ██ ██ ██   ██      ██
			██      ███████  ██████  ██ ██████  ███████
		*/

	const cumsprite = {
		chest: [null, "1", "2", "3", "4", "4"],
		face: [null, "1", "1", "2", "2", "3"],
		feet: [null, null, "1", "1", "2", "2"],
		leftarm: [null, "1", "1", "1", "2", "2"],
		rightarm: [null, "1", "1", "1", "2", "2"],
		neck: [null, "1", "1", "2", "2", "3"],
		thigh: [null, "1", "2", "3", "4", "5"],
		tummy: [null, "1", "2", "3", "4", "5"],
	};
	const bodyparts = ["chest", "face", "feet", "leftarm", "rightarm", "neck", "thigh", "tummy"];
	bodyparts.forEach(bodypart => {
		const liquidamt = Math.clamp(setup.bodyliquid.combined(bodypart), 0, 5);
		T.modeloptions["cum_" + bodypart] = cumsprite[bodypart].select(liquidamt);
	});

	/***
	 *    ███████  ██████  ██      ██       ██████  ██     ██ ███████ ██████
	 *    ██      ██    ██ ██      ██      ██    ██ ██     ██ ██      ██   ██
	 *    █████   ██    ██ ██      ██      ██    ██ ██  █  ██ █████   ██████
	 *    ██      ██    ██ ██      ██      ██    ██ ██ ███ ██ ██      ██   ██
	 *    ██       ██████  ███████ ███████  ██████   ███ ███  ███████ ██   ██
	 */

	if (V.follower) {
		T.modeloptions.follower = V.follower;
	}

	/**
	 *     ██████  █████  ███    ██ ██    ██  █████  ███████
	 *    ██      ██   ██ ████   ██ ██    ██ ██   ██ ██
	 *    ██      ███████ ██ ██  ██ ██    ██ ███████ ███████
	 *    ██      ██   ██ ██  ██ ██  ██  ██  ██   ██      ██
	 *     ██████ ██   ██ ██   ████   ████   ██   ██ ███████
	 *
	 *    ███████ ███████ ███████ ███████  ██████ ████████ ███████
	 *    ██      ██      ██      ██      ██         ██    ██
	 *    █████   █████   █████   █████   ██         ██    ███████
	 *    ██      ██      ██      ██      ██         ██         ██
	 *    ███████ ██      ██      ███████  ██████    ██    ███████
	 */

	T.modeloptions.precipitation =
		V.options.showSidebarEffects && Weather.precipitation !== "none" && Weather.overcast > 0.25 && V.outside === 1 && !V.underwater;
	T.modeloptions.wraithFlash = V.options.showSidebarEffects;
	T.modeloptions.water = V.options.showSidebarEffects && (V.underwater === 1 || T.tempEffects?.underwater);
	T.modeloptions.waterBreath = V.options.showSidebarEffects && T.modeloptions.water && T.tempEffects?.underwater !== "noMouth";
	T.modeloptions.fire = V.options.showSidebarEffects && (V.fire || T.tempEffects?.fire || (V.farm_assault && V.fields_damaged.includes(V.bus)));
	T.modeloptions.fireFront = V.options.showSidebarEffects && (T.tempEffects?.fireFront || (V.farm_assault && V.fields_damaged.length >= 1));
	T.modeloptions.temperature = V.options.showSidebarEffects && !T.modeloptions.fire && !T.modeloptions.water && V.outside === 1 && Weather.temperature <= 5;
	T.modeloptions.temperature = V.options.showSidebarEffects && !T.modeloptions.fire && !T.modeloptions.water && V.outside === 1 && Weather.temperature <= 5;
	T.modeloptions.petals = V.options.showSidebarEffects && T.tempEffects?.petals;
	if (T.modeloptions.petals) T.modeloptions.petalColour = V.sexRitual && V.gwylanSeen?.includes("romance") ? "pink" : "red-white";
	T.modeloptions.vines = T.tempEffects?.vines;
});

DefineMacro("modelprepare-player-clothes", function () {
	T.modeloptions.breasts =
		!V.worn.upper.type.includes("naked") || !V.worn.under_upper.type.includes("naked") || T.coverBreastsWithArm ? "cleavage" : "default";

	if (V.worn.under_upper.type.includes("chest_bind")) {
		T.modeloptions.breast_size = 1;
	}

	if (V.worn.lower.exposed >= 2 && V.worn.under_lower.exposed >= 1 && !V.worn.legs.name.includes("tights")) {
		T.modeloptions.crotch_visible = true;
		T.modeloptions.crotch_exposed = true;
	} else if ((V.lowerwetstage > 0 || V.worn.lower.type.includes("naked")) && (V.underlowerwetstage > 0 || V.worn.under_lower.type.includes("naked"))) {
		T.modeloptions.crotch_visible = true;
		T.modeloptions.crotch_exposed = false;
	} else {
		T.modeloptions.crotch_visible = false;
	}

	T.modeloptions.hood_down = V.worn.upper.hoodposition === "down";

	if (
		((V.worn.over_head.hood === 1 && V.worn.over_head.mask_img !== 1) || (V.worn.head.hood === 1 && V.worn.head.mask_img !== 1)) &&
		V.worn.upper.hoodposition === "down"
	) {
		T.modeloptions.hair_sides_length = "short";
		T.modeloptions.hair_fringe_length = "short";
	}

	T.modeloptions.facewear_layer = V.facelayer;
	T.modeloptions.upper_tucked = V.upperTucked && !setup.clothes.upper[clothesIndex("upper", V.worn.upper)].notuck && V.worn.upper.outfitPrimary === undefined;
	T.modeloptions.lower_tucked = !V.worn.feet.notuck && !V.worn.lower.notuck && V.lowerTucked;
	T.modeloptions.belly_tucked =
		V.bellyTucked === 1 &&
		V.player.bodyshape === "soft" &&
		V.worn.lower.name !== "naked" &&
		(!setup.clothes.lower[clothesIndex("lower", V.worn.lower)].outfitSecondary ||
			setup.clothes.lower[clothesIndex("lower", V.worn.lower)]?.outfitSecondary[1] !== V.worn.upper.name);

	Object.assign(T.modeloptions, getClothingOptions());
	const overrides = V.modeloptionsOverride;
	if (Object.keys(overrides).length > 0) {
		for (const [key, value] of Object.entries(overrides)) {
			T.modeloptions[key] = value;
		}
	}
});

function clamp255(val) {
	return val > 255 ? 255 : val < 0 ? 0 : val;
}
function applySepiaFilter(colour, amount) {
	amount = 1.0 - amount;
	return {
		r: clamp255((0.393 + 0.607 * amount) * colour.r + (0.769 - 0.769 * amount) * colour.g + (0.189 - 0.189 * amount) * colour.b),
		g: clamp255((0.349 - 0.349 * amount) * colour.r + (0.686 + 0.314 * amount) * colour.g + (0.168 - 0.168 * amount) * colour.b),
		b: clamp255((0.272 - 0.272 * amount) * colour.r + (0.534 - 0.534 * amount) * colour.g + (0.131 + 0.869 * amount) * colour.b),
	};
}
function applySaturateFilter(colour, amount) {
	return {
		r: clamp255((0.213 + 0.787 * amount) * colour.r + (0.715 - 0.715 * amount) * colour.g + (0.072 - 0.072 * amount) * colour.b),
		g: clamp255((0.213 - 0.213 * amount) * colour.r + (0.715 + 0.285 * amount) * colour.g + (0.072 - 0.072 * amount) * colour.b),
		b: clamp255((0.213 - 0.213 * amount) * colour.r + (0.715 - 0.715 * amount) * colour.g + (0.072 + 0.928 * amount) * colour.b),
	};
}
function applyHueRotateFilter(colour, amount) {
	const c = Math.cos((amount * Math.PI) / 180.0);
	const s = Math.sin((amount * Math.PI) / 180.0);
	return {
		r: clamp255(colour.r * (0.213 + c * 0.787 - s * 0.213) + colour.g * (0.715 - c * 0.715 - s * 0.715) + colour.b * (0.072 - c * 0.072 + s * 0.928)),
		g: clamp255(colour.r * (0.213 - c * 0.213 + s * 0.143) + colour.g * (0.715 + c * 0.285 + s * 0.14) + colour.b * (0.072 - c * 0.072 - s * 0.283)),
		b: clamp255(colour.r * (0.213 - c * 0.213 - s * 0.787) + colour.g * (0.715 - c * 0.715 + s * 0.715) + colour.b * (0.072 + c * 0.928 + s * 0.072)),
	};
}
function applyBrightnessFilter(colour, amount) {
	return { r: colour.r * amount, g: colour.g * amount, b: colour.b * amount };
}
function contrast(n, amount) {
	return clamp255((n - 128) * amount + 128);
}
function applyContrastFilter(colour, amount) {
	return {
		r: contrast(colour.r, amount),
		g: contrast(colour.g, amount),
		b: contrast(colour.b, amount),
	};
}
const getCustomColourRGB = function (hue, saturation, brightness, contrast, sepia = 0) {
	let col = { r: 255, g: 0, b: 0 };
	col = applyHueRotateFilter(col, hue);
	col = applySaturateFilter(col, saturation);
	col = applyBrightnessFilter(col, brightness);
	col = applyContrastFilter(col, contrast);
	col = applySepiaFilter(col, sepia);
	return { r: clamp255(col.r), g: clamp255(col.g), b: clamp255(col.b) };
};
const parseCSSFilter = function (filter) {
	// extract values from filter string
	const result = filter.match(
		/(?:filter: hue-rotate\((-?\d{1,3})(?:deg\))? *(?:saturate\()([\d.]+)\))? *(?:brightness\(([\d.]+)\))? *(?:contrast\(([\d.]+)\))? *(?:sepia\(([\d.]+)\))?/
	);
	if (result[1] === undefined) result[1] = 0;
	if (result[2] === undefined) result[2] = 1;
	if (result[3] === undefined) result[3] = 1;
	if (result[4] === undefined) result[4] = 1;
	if (result[5] === undefined) result[5] = 0;
	return result;
};
const getCustomClothesColourCanvasFilter = function (hue, saturation, brightness, contrast, sepia = 0) {
	if (arguments.length === 1 && typeof arguments[0] === "string") {
		const match = parseCSSFilter(arguments[0]);
		if (!match) return clone(setup.colours.clothes_default);
		hue = +match[1];
		saturation = +match[2];
		brightness = +match[3];
		contrast = +match[4];
		sepia = +match[5];
	}
	let filterBrightness = 0.0;
	if (brightness >= 1.0) {
		// Slider brightness is 0..4, we consider 0..1 for colour spec
		// and everything above as extra brightness adjustment
		// In new renderer it's a shift, not multiplier, so we scale it from x1..x4 to +0..+0.21
		filterBrightness += Math.max(0, (brightness - 1) * 0.07 - (1 - saturation) * 0.21);
	}
	return Renderer.mergeLayerData(
		{
			blend: tinycolor(getCustomColourRGB(hue, saturation, brightness, contrast, sepia)).toHexString(),
			contrast,
			brightness: filterBrightness,
		},
		setup.colours.clothes_default
	);
};
const model=Renderer.locateModel('main');
T.modeloptions=model.defaultOptions();
macros['modelprepare-player-body']();macros['modelprepare-player-clothes']();
T.modeloptions.wraithFlash=false;
return {model,options:T.modeloptions,renderer:Renderer};
}

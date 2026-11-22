import * as _deadly_poison from './cards/_deadly-poison.js'
import * as adrenaline from './cards/adrenaline.js'
import * as bash from './cards/bash.js'
import * as bludgeon from './cards/bludgeon.js'
import * as body_slam from './cards/body-slam.js'
import * as clash from './cards/clash.js'
import * as cleave from './cards/cleave.js'
import * as defend from './cards/defend.js'
import * as flourish from './cards/flourish.js'
import * as intimidate from './cards/intimidate.js'
import * as iron_wave from './cards/iron-wave.js'
import * as mask_of_the_faceless from './cards/mask-of-the-faceless.js'
import * as pommel_strike from './cards/pommel-strike.js'
import * as ritual_rain from './cards/ritual-rain.js'
import * as soul_drain from './cards/soul-drain.js'
import * as strike from './cards/strike.js'
import * as succube from './cards/succube.js'
import * as sucker_punch from './cards/sucker-punch.js'
import * as summer_of_sam from './cards/summer-of-sam.js'
import * as terror from './cards/terror.js'
import * as thunderclap from './cards/thunderclap.js'
import * as voodoo_gift from './cards/voodoo-gift.js'

// Static registration for the offline browser bundle.
const modules = [_deadly_poison, adrenaline, bash, bludgeon, body_slam, clash, cleave, defend, flourish, intimidate, iron_wave, mask_of_the_faceless, pommel_strike, ritual_rain, soul_drain, strike, succube, sucker_punch, summer_of_sam, terror, thunderclap, voodoo_gift]
export const cards = modules.map((module) => module.default)
export const cardUpgrades = Object.fromEntries(modules.map((module) => [module.default.name, module.upgrade]))

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const abor_1 = __importDefault(require("./registration/abor"));
const allo_1 = __importDefault(require("./registration/allo"));
const appe_1 = __importDefault(require("./registration/appe"));
const auth_1 = __importDefault(require("./registration/auth"));
const cdup_1 = __importDefault(require("./registration/cdup"));
const cwd_1 = __importDefault(require("./registration/cwd"));
const dele_1 = __importDefault(require("./registration/dele"));
const feat_1 = __importDefault(require("./registration/feat"));
const help_1 = __importDefault(require("./registration/help"));
const list_1 = __importDefault(require("./registration/list"));
const mdtm_1 = __importDefault(require("./registration/mdtm"));
const mkd_1 = __importDefault(require("./registration/mkd"));
const mode_1 = __importDefault(require("./registration/mode"));
const nlst_1 = __importDefault(require("./registration/nlst"));
const noop_1 = __importDefault(require("./registration/noop"));
const opts_1 = __importDefault(require("./registration/opts"));
const pass_1 = __importDefault(require("./registration/pass"));
const pasv_1 = __importDefault(require("./registration/pasv"));
const port_1 = __importDefault(require("./registration/port"));
const pwd_1 = __importDefault(require("./registration/pwd"));
const quit_1 = __importDefault(require("./registration/quit"));
const rest_1 = __importDefault(require("./registration/rest"));
const retr_1 = __importDefault(require("./registration/retr"));
const rmd_1 = __importDefault(require("./registration/rmd"));
const rnfr_1 = __importDefault(require("./registration/rnfr"));
const rnto_1 = __importDefault(require("./registration/rnto"));
const site_1 = __importDefault(require("./registration/site"));
const size_1 = __importDefault(require("./registration/size"));
const stat_1 = __importDefault(require("./registration/stat"));
const stor_1 = __importDefault(require("./registration/stor"));
const stou_1 = __importDefault(require("./registration/stou"));
const stru_1 = __importDefault(require("./registration/stru"));
const syst_1 = __importDefault(require("./registration/syst"));
const type_1 = __importDefault(require("./registration/type"));
const user_1 = __importDefault(require("./registration/user"));
const pbsz_1 = __importDefault(require("./registration/pbsz"));
const prot_1 = __importDefault(require("./registration/prot"));
const eprt_1 = __importDefault(require("./registration/eprt"));
const epsv_1 = __importDefault(require("./registration/epsv"));
const commands = [
    abor_1.default, allo_1.default, appe_1.default, auth_1.default, cdup_1.default, cwd_1.default, dele_1.default, feat_1.default, help_1.default, list_1.default, mdtm_1.default, mkd_1.default, mode_1.default,
    nlst_1.default, noop_1.default, opts_1.default, pass_1.default, pasv_1.default, port_1.default, pwd_1.default, quit_1.default, rest_1.default, retr_1.default, rmd_1.default, rnfr_1.default, rnto_1.default,
    site_1.default, size_1.default, stat_1.default, stor_1.default, stou_1.default, stru_1.default, syst_1.default, type_1.default, user_1.default, pbsz_1.default, prot_1.default, eprt_1.default, epsv_1.default
];
const registry = {};
for (const cmd of commands) {
    const aliases = Array.isArray(cmd.directive) ? cmd.directive : [cmd.directive];
    for (const alias of aliases) {
        registry[alias] = cmd;
    }
}
exports.default = registry;

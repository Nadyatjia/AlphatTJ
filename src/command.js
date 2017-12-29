const { Message, OpType, Location, Profile } = require('../curve-thrift/line_types');
const LineAPI = require('./api');
const request = require('request');
const fs = require('fs');
const unirest = require('unirest');
const webp = require('webp-converter');
const path = require('path');
const rp = require('request-promise');
const config = require('./config');

//let exec = require('child_process').exec;

class Command extends LineAPI {
//class LINE extends LineAPI {

    constructor() {
        super();
        this.spamName = [];
    }

    get payload() {
        if(typeof this.messages !== 'undefined'){
            return (this.messages.text !== null) ? this.messages.text.split(' ').splice(1) : '' ;
        }
        return false;
    }

    async getProfile() {
        let { displayName } = await this._myProfile();
        return displayName;
    }


    async cancelMember() {
        let groupID;
        if(this.payload.length > 0) {
            let [ groups ] = await this._findGroupByName(this.payload.join(' '));
            groupID = groups.id;
        } 
        let gid = groupID || this.messages.to;
        let { listPendingInvite } = await this.searchGroup(gid);
        if(listPendingInvite.length > 0){
            this._cancel(gid,listPendingInvite);
        }
    }

    async searchGroup(gid) {
        let listPendingInvite = [];
        let thisgroup = await this._getGroups([gid]);
        if(thisgroup[0].invitee !== null) {
            listPendingInvite = thisgroup[0].invitee.map((key) => {
                return key.mid;
            });
        }
        let listMember = thisgroup[0].members.map((key) => {
            return { mid: key.mid, dn: key.displayName };
        });

        return { 
            listMember,
            listPendingInvite
        }
    }

    OnOff() {
        if(this.isAdminOrBot(this.messages.from)){
            let [ actions , status ] = this.messages.text.split(' ');
            const action = actions.toLowerCase();
            const state = status.toLowerCase() == 'on' ? 1 : 0;
            this.stateStatus[action] = state;
            this._sendMessage(this.messages,`Status: \n${JSON.stringify(this.stateStatus)}`);
        } else {
            this._sendMessage(this.messages,`Kamu Bukan Admin, Mau Jadi Admin? PC Admin1`);
            this._sendMessage(this.messages,`Ketik Keyword Ini Untuk Melihat Admin : Admin1                      Admin2                      Admin3                      Admin4                      Admin5                      Admin6                      Admin7                      Admin8                      Admin9                      Admin10                     Admin11                     Admin12                     Admin13                     Admin14                     Admin15`);
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
    }

    mention(listMember) {
        let mentionStrings = [''];
        let mid = [''];
        for (var i = 0; i < listMember.length; i++) {
            mentionStrings.push('@'+listMember[i].displayName+'\n');
            mid.push(listMember[i].mid);
        }
        let strings = mentionStrings.join('');
        let member = strings.split('@').slice(1);
        
        let tmp = 0;
        let memberStart = [];
        let mentionMember = member.map((v,k) => {
            let z = tmp += v.length + 1;
            let end = z - 1;
            memberStart.push(end);
            let mentionz = `{"S":"${(isNaN(memberStart[k - 1] + 1) ? 0 : memberStart[k - 1] + 1 ) }","E":"${end}","M":"${mid[k + 1]}"}`;
            return mentionz;
        })
        return {
            names: mentionStrings.slice(1),
            cmddata: { MENTION: `{"MENTIONEES":[${mentionMember}]}` }
        }
    }

    async leftGroupByName(name) {
        let payload = name || this.payload.join(' ');
        let gid = await this._findGroupByName(payload);
        for (let i = 0; i < gid.length; i++) {
            this._leaveGroup(gid[i].id);
        }
        return;
    }

    async recheck(cs,group) {
        let users;
        for (var i = 0; i < cs.length; i++) {
            if(cs[i].group == group) {
                users = cs[i].users;
            }
        }
        
        let contactMember = await this._getContacts(users);
        return contactMember.map((z) => {
                return { displayName: z.displayName, mid: z.mid };
            });
    }

    removeReaderByGroup(groupID) {
        const groupIndex = this.checkReader.findIndex(v => {
            if(v.group == groupID) {
                return v
            }
        })

        if(groupIndex != -1) {
            this.checkReader.splice(groupIndex,1);
        }
    }

    async getSpeed() {
        let curTime = Date.now() / 1000;
        await this._sendMessage(this.messages, 'Loading. . .');
        const rtime = (Date.now() / 1000) - curTime;
        await this._sendMessage(this.messages, `${rtime} Second`);
        return;
    }

    async tagall() {
        let rec = await this._getGroup(this.messages.to);
        const mentions = await this.mention(rec.members);
        this.messages.contentMetadata = mentions.cmddata;
        await this._sendMessage(this.messages,mentions.names.join(''));
        return;
    }

    async tagall2() {
        let rec = await this._getGroup(this.messages.to);
        const mentions = await this.mention(rec.members);
        this.messages.contentMetadata = mentions.cmddata;
        await this._sendMessage(this.messages,mentions.names.join(''));
        return;
    }

    vn() {
        this._sendFile(this.messages,`${__dirname}/../download/${this.payload.join(' ')}.m4a`,3);
    }

    lagu() {
     {
        this._sendFile(this.messages,`${__dirname}/../download/${this.payload.join(' ')}.mp3`,3);
    }
    {
        this._sendMessage(this.messages, `Ok, Sabar Ya Kak, Tungguin... Lagu Kakak Lagi Aku Prosses ^_^`);
    }
    }

    video() {
    {
        this._sendFile(this.messages,`${__dirname}/../download/${this.payload.join(' ')}.mp4`,2);
    }
         this._sendMessage(this.messages, `Ok, Sabar Ya Kak, Tungguin... Video Kakak Lagi Aku Prosses ^_^`);
    }

    checkKernel() {
        exec('uname -a',(err, sto) => {
            if(err) {
                this._sendMessage(this.messages, err);
                return
            }
            this._sendMessage(this.messages, sto);
            return;
        });
    }

    setReader() {
        this._sendMessage(this.messages, "#↔️↔️↔️↔️ CCTV AKTIF ↔️↔️↔️↔️️#"+
"           #️ Ketik Cyduk Untuk Melihat Sider! ️#");
        this.removeReaderByGroup(this.messages.to);
        return;
    }

    keluar() {
       {            this._sendMessage(this.messages, `Apakah Kamu Yakin Mau Ngusir Aku??? :(`);
      }
      {
                    this._sendMessage(this.messages, `Ketik "#ya" Atau "#tidak"`);
      }
            return;
      }

    batal() {
                   this._sendMessage(this.messages, `Yaaay..., Maaciih Karna Udah Gak Jadi Ngusir Aku ^__^`);
      }


    spam2() {
                    this._sendMessage(this.messages, `3`);
                    this._sendMessage(this.messages, `2`);
                    this._sendMessage(this.messages, `1`);
                    this._sendMessage(this.messages, `Fuck Off`);
                    this._sendMessage(this.messages, `Ku mengejar bus yang mulai berjalan`);
                    this._sendMessage(this.messages, `Ku ingin ungkapkan kepada dirimu`);
                    this._sendMessage(this.messages, `Kabut dalam hatiku telah menghilang`);
                    this._sendMessage(this.messages, `Dan hal yang penting bagiku pun terlihat`);
                    this._sendMessage(this.messages, `Walaupun jawaban itu sebenarnya begitu mudah`);
                    this._sendMessage(this.messages, `Tetapi entah mengapa diriku melewatkannya`);
                    this._sendMessage(this.messages, `Untukku menjadi diri sendiri`);
                    this._sendMessage(this.messages, `Ku harus jujur, pada perasaanku`);
                    this._sendMessage(this.messages, `Ku suka dirimu ku suka`);
                    this._sendMessage(this.messages, `Ku berlari sekuat tenaga`);
                    this._sendMessage(this.messages, `Ku suka selalu ku suka`);
                    this._sendMessage(this.messages, `Ku teriak sebisa suaraku`);
                    this._sendMessage(this.messages, `Ku suka dirimu ku suka`);
                    this._sendMessage(this.messages, `Walau susah untukku bernapas`);
                    this._sendMessage(this.messages, `Tak akan ku sembunyikan`);
                    this._sendMessage(this.messages, `Oogoe daiyamondo~`);
                    this._sendMessage(this.messages, `Saat ku sadari sesuatu menghilang`);
                    this._sendMessage(this.messages, `Hati ini pun resah tidak tertahankan`);
                    this._sendMessage(this.messages, `Sekarang juga yang bisa ku lakukan`);
                    this._sendMessage(this.messages, `Merubah perasaan ke dalam kata kata`);
                    this._sendMessage(this.messages, `Mengapa sedari tadi`);
                    this._sendMessage(this.messages, `Aku hanya menatap langit`);
                    this._sendMessage(this.messages, `Mataku berkaca kaca`);
                    this._sendMessage(this.messages, `Berlinang tak bisa berhenti`);
                    this._sendMessage(this.messages, `Di tempat kita tinggal, didunia ini`);
                    this._sendMessage(this.messages, `Dipenuhi cinta, kepada seseorang`);
                    this._sendMessage(this.messages, `Ku yakin ooo ku yakin`);
                    this._sendMessage(this.messages, `Janji tak lepas dirimu lagi`);
                    this._sendMessage(this.messages, `Ku yakin ooo ku yakin`);
                    this._sendMessage(this.messages, `Akhirnya kita bisa bertemu`);
                    this._sendMessage(this.messages, `Ku yakin ooo ku yakin`);
                    this._sendMessage(this.messages, `Ku akan bahagiakan dirimu`);
                    this._sendMessage(this.messages, `Ku ingin kau mendengarkan`);
                    this._sendMessage(this.messages, `Oogoe daiyamondo~`);
                    this._sendMessage(this.messages, `Jika jika kamu ragu`);
                    this._sendMessage(this.messages, `Takkan bisa memulai apapun`);
                    this._sendMessage(this.messages, `Ungkapkan perasaanmu`);
                    this._sendMessage(this.messages, `Jujurlah dari sekarang juga`);
                    this._sendMessage(this.messages, `Jika kau bersuar`);
                    this._sendMessage(this.messages, `Cahaya kan bersinar`);
                    this._sendMessage(this.messages, `Ku suka dirimu ku suka`);
                    this._sendMessage(this.messages, `Ku berlari sekuat tenaga`);
                    this._sendMessage(this.messages, `Ku suka selalu ku suka`);
                    this._sendMessage(this.messages, `Ku teriak sebisa suaraku`);
                    this._sendMessage(this.messages, `Ku suka dirimu ku suka`);
                    this._sendMessage(this.messages, `Sampaikan rasa sayangku ini`);
                    this._sendMessage(this.messages, `Ku suka selalu ku suka`);
                    this._sendMessage(this.messages, `Ku teriakkan ditengah angin`);
                    this._sendMessage(this.messages, `Ku suka dirimu ku suka`);
                    this._sendMessage(this.messages, `Walau susah untuk ku bernapas`);
                    this._sendMessage(this.messages, `Tak akan ku sembunyikan`);
                    this._sendMessage(this.messages, `Oogoe daiyamondo~`);
                    this._sendMessage(this.messages, `Katakan dengan berani`);
                    this._sendMessage(this.messages, `Jika kau diam kan tetap sama`);
                    this._sendMessage(this.messages, `Janganlah kau merasa malu`);
                    this._sendMessage(this.messages, `“Suka” itu kata paling hebat!`);
                    this._sendMessage(this.messages, `“Suka” itu kata paling hebat!`);
                    this._sendMessage(this.messages, `“Suka” itu kata paling hebat!`);
                    this._sendMessage(this.messages, `Ungkapkan perasaanmu`);
                    this._sendMessage(this.messages, `Jujurlah dari sekarang juga..`);
                    this._sendMessage(this.messages, `SPAM IS DONE`);
           return;
    }

    clear() {
        this._sendMessage(this.messages, `List Sider Terhapus !`);
        this.checkReader = [];
        return
    }

    list() {
            this._sendMessage(this.messages,`Ketik Keyword Ini Untuk Melihat Admin : Admin1                      Admin2                      Admin3                      Admin4                      Admin5                      Admin6                      Admin7                      Admin8                      Admin9                      Admin10                     Admin11                     Admin12                     Admin13                     Admin14                     Admin15`);
     }

creator() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u14f64e139a3817afaabe27d237afb36b'}
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin1() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u14f64e139a3817afaabe27d237afb36b'}
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin2() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u653c0c37cdaefb7f583023c02cb8384a' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin3() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u2297b268eec8988b3c32ffa058b0a248' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin4() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'uea50f7108c44b400a9f70b75f7848fcf' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin5() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u7235ccb3dd6b587f28fec4044901d710' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin6() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'ua89b571977cb320814c4175591db2d23' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin7() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u90a32052cf753761431423d1ee234591' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin8() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u8b8fad7361ed7c32a1b9c2448732f528' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }

admin9() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u7cbe6149e62a5df0d42c46f590760601' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
}

admin10() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u8748762cfc5091da024235c27975a0e0' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
}

admin11() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'ue43a33a6ea6350447b7ca1de72e23c2e' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
}

admin12() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u8333a7b83f7742aa795672420d2376df' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
}

admin13() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'ud7fb95cc02f0f7d09898669633520040' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
}

admin14() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u7b62234875424b196927381b177112c9' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
}

admin15() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'uc486961efab83d61d218fa7d8a735661' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
}

    admin16() {
                    this._sendMessage(this.messages, `Admin 16 Belom Ada`);
     }

    admin17() {
                    this._sendMessage(this.messages, `Admin 17 Belom Ada`);
     }

    admin18() {
                    this._sendMessage(this.messages, `Admin 18 Belom Ada`);
     }

    admin19() {
                    this._sendMessage(this.messages, `Admin 19 Belom Ada`);
     }

    admin20() {
                    this._sendMessage(this.messages, `Admin 20 Belom Ada`);
     }

bot2() {
        let msg = {
            text:null,
            contentType: 13,
            contentPreview: null,
            contentMetadata: 
            { mid: 'u659f68789c0e74d37cdd97c0e879c73e' }
        }
        Object.assign(this.messages,msg);
        this._sendMessage(this.messages);
 }


    resetStateUpload() {
        this.stateUpload = {
            file: '',
            name: '',
            group: '',
            sender: ''
        };
    }

    prepareUpload() {
        this.stateUpload = {
            file: true,
            name: this.payload.join(' '),
            group: this.messages.to,
            sender: this.messages.from
        };
        this._sendMessage(this.messages,` ${this.stateUpload.name}`);
        return;
    }
    
    async doUpload({ id, contentType }) {
        let url = `https://obs-sg.line-apps.com/talk/m/download.nhn?oid=${id}`;
        await this._download(url,this.stateUpload.name, contentType);
        this.messages.contentType = 0;
        this._sendMessage(this.messages,` ${this.stateUpload.name} `);
        this.resetStateUpload()
        return;
    }

    searchLocalImage() {
        let name = this.payload.join(' ');
        let dirName = `${__dirname}/../download/${name}.jpg`;
        try {
            this._sendImage(this.messages,dirName);
        } catch (error) {
             this._sendImage(this.messages,`No Photo #${name} Uploaded `);
        }
        return ;
        
    }

    async joinQr() {
        const [ ticketId ] = this.payload[0].split('g/').splice(-1);
        let { id } = await this._findGroupByTicket(ticketId);
        await this._acceptGroupInvitationByTicket(id,ticketId);
        return;
    }

    async qrOpenClose() {
        let updateGroup = await this._getGroup(this.messages.to);
        updateGroup.preventJoinByTicket = true;
        if(typeof this.payload !== 'undefined') {
            let [ type ] = this.payload;

            if(type === 'open') {
                updateGroup.preventJoinByTicket = false;
                const groupUrl = await this._reissueGroupTicket(this.messages.to)
                this._sendMessage(this.messages,`Line group = line://ti/g/${groupUrl}`);
            }
        }
        await this._updateGroup(updateGroup);
        return;
    }

    spamGroup() {
        if(this.isAdminOrBot(this.messages.from) && this.payload[0] !== 'kill') {
            let s = [];
            for (let i = 0; i < this.payload[1]; i++) {
                let name = `${Math.ceil(Math.random() * 1000)}${i}`;
                this.spamName.push(name);
                this._createGroup(name,[this.payload[0]]);
            }
            return;
        } 
        for (let z = 0; z < this.spamName.length; z++) {
            this.leftGroupByName(this.spamName[z]);
        }
        return true;
    }

    checkIP() {
        exec(`wget ipinfo.io/${this.payload[0]} -qO -`,(err, res) => {
            if(err) {
                this._sendMessage(this.messages,'Error Please Install Wget');
                return 
            }
            const result = JSON.parse(res);
            if(typeof result.error == 'undefined') {
                const { org, country, loc, city, region } = result;
                try {
                    const [latitude, longitude ] = loc.split(',');
                    let location = new Location();
                    Object.assign(location,{ 
                        title: `Location:`,
                        address: `${org} ${city} [ ${region} ]\n${this.payload[0]}`,
                        latitude: latitude,
                        longitude: longitude,
                        phone: null 
                    })
                    const Obj = { 
                        text: 'Location',
                        location : location,
                        contentType: 0,
                    }
                    Object.assign(this.messages,Obj)
                    this._sendMessage(this.messages,'Location');
                } catch (err) {
                    this._sendMessage(this.messages,'Not Found');
                }
            } else {
                this._sendMessage(this.messages,'Location Not Found , Maybe di dalem goa');
            }
        })
        return;
    }

    async rechecks() {
        let rec = await this.recheck(this.checkReader,this.messages.to);
        const mentions = await this.mention(rec);
        this.messages.contentMetadata = mentions.cmddata;
        await this._sendMessage(this.messages,mentions.names.join('')+

"#↔️↔️↔️️↔️Sider Tercyduk↔️↔️↔️↔️#"+
"                                        ️#Ketik Clear Untuk Hapus List Sider#");
        return;
    }

    infokick() {
                    this._sendMessage(this.messages, `Cara Menggunakan Fitur Kickall :
1. Ketik Kick on
2. Kalau Seperti Ini Berarti Kick Mode Sudah On
    Status: 
"cancel":0,"kick":1
3. Terakhir, Kamu Ketik Kickall (Gak Pake Spasi)
4. Done~`);
     }


    async kickAll() {
        let groupID;
        if(this.stateStatus.kick == 1 && this.isAdminOrBot(this.messages.from)) {
            let target = this.messages.to;
            if(this.payload.length > 0) {
                let [ groups ] = await this._findGroupByName(this.payload.join(' '));
                groupID = groups.id;
            }
            let { listMember } = await this.searchGroup(groupID || target);
            for (var i = 0; i < listMember.length; i++) {
                if(!this.isAdminOrBot(listMember[i].mid)){
                    this._kickMember(groupID || target,[listMember[i].mid])
                }
            }
            return;
        } 
        return this._sendMessage(this.messages, ' Kick Error, Fitur Kick Hanya Untuk Admin Saja!');
    }

    help() {
           this._sendMessage(this.messages, `           👤 Keyword Khusus Admin 👤
[🔹]Kick On/Off ⏩ Mode Kick
[🔹]Kickall ⏩ Mengekick Semua Member
[🔹]Info kick ⏩ Cara Memakai Kickall
[🔹]Cancel On/Off ⏩ Mode Cancel
[🔹]Cancelall ⏩ Cancel Semua Invite
[🔹]Qrp On/Off ⏩ Protect Link QR

           👥 Keyword Dalam Group 👥
[🔹]Chucky keluar ⏩ Bot Keluar
[🔹]Status ⏩ Status Cancel/Kick/Qrp
[🔹]Speed ⏩ Ngetest Respons Bot
[🔹]Left NamaGroup ⏩ Bot Keluar
[🔹]Setpoint/Set/Cctv ⏩ Cctv Aktif
[🔹]Recheck/Check ⏩ Cek Sider
[🔹]Clear/Reset ⏩ Hapus List Sider
[🔹]Myid ⏩ Untuk Mengetahui MID
[🔹]Ig Ursname Kamu ⏩ Info Instagram
[🔹]Qr Open/Close ⏩ Link Group
[🔹]spam (S Kecil) ⏩ Bot Akan Spam
[🔹]List admin ⏩ Melihat Daftar Admin
[🔹]Tag all ⏩ Mengetag Semua Member
[🔹]Creator ⏩ Owner Pembuat Bot
[🔹]Gift ⏩ Gift Sticker & Gift Tema
[🔹]Suara bot1/bot2 ⏩ Suara Bot
[🔹]Media ⏩ Daftar Pap & Musik
#↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔️↔#`);
     }

    media() {
                    this._sendMessage(this.messages, `              🎶 Keyword Media 🎶
[🔹]Pap owner/tt/tete/naked/bugil/pocong/titid/tytyd/kaget/tai/taik/kucing/anjing ⏩ Untuk Melihat Gambar Yang Dipilih

[🔹]Musik funny/broken/siul/spongebob/simfoni/titanic ⏩ Bot Akan Send Musik Yang Dipilih

[🔹]List lagu1 ⏩ Melihat Daftar Lagu
[🔹]List lagu2 ⏩ Melihat Daftar Lagu`);
     }

    listlagu1() {
                    this._sendMessage(this.messages, `           🎶 List Lagu 1 🎶
[🎵]/lagu baby shark
[🎵]/lagu ML
[🎵]/lagu despacito
[🎵]/lagu faded
[🎵]/lagu dear god
[🎵]/lagu jadi aku sebentar saja
[🎵]/lagu mendua
[🎵]/lagu tentang rasa
[🎵]/lagu sayang
[🎵]/lagu jaran goyang
[🎵]/lagu goyang dumang`);
      }

    listlagu2() {
                    this._sendMessage(this.messages, `           🎶 List Lagu 2 🎶
[🎵]/lagu asal kau bahagia
[🎵]/lagu canon rock
[🎵]/lagu closer
[🎵]/lagu dusk till dawn
[🎵]/lagu rockabye
[🎵]/lagu shape of you
[🎵]/lagu perfect
[🎵]/lagu hilang
[🎵]/lagu salah`);
      }

    gift() {
                    this._sendMessage(this.messages, `     🎁 STICKER 🎁

[🎉]Gift sticker 1
[🎉]Gift sticker 2
[🎉]Gift sticker 3
[🎉]Gift sticker 4

      🎁 THEMA 🎁

[🎉]Gift tema 1
[🎉]Gift tema 2
[🎉]Gift tema 3
[🎉]Gift tema 4`);
      }


    async checkIG() {
        try {
            let { userProfile, userName, bio, media, follow } = await this._searchInstagram(this.payload[0]);
            await this._sendFileByUrl(this.messages,userProfile);
            await this._sendMessage(this.messages, `${userName}\n\nBIO:\n${bio}\n\n\uDBC0 ${follow} \uDBC0`)
            if(Array.isArray(media)) {
                for (let i = 0; i < media.length; i++) {
                    await this._sendFileByUrl(this.messages,media[i]);
                }
            } else {
                this._sendMessage(this.messages,media);
            }
        } catch (error) {
            this._sendMessage(this.messages,`Error: ${error}`);
        }
        return;
    }
}

//module.exports = Command;
module.exports = new Command();
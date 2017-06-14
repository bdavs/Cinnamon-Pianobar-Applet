const Applet = imports.ui.applet;
const St = imports.gi.St;
const Cinnamon = imports.gi.Cinnamon;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Gettext = imports.gettext;
const UUID = "nowplaying@cinnamon.org";
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const PWD = "/home/bobby/.local/share/cinnamon/applets/nowplaying@cinnamon.org";

Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale")

function _(str) {
    return Gettext.dgettext(UUID, str);
}

function MyApplet(orientation, panel_height, instane_id) {
    this._init(orientation, panel_height, instane_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,
    _timeout: null,

    _init: function(orientation, panel_height, instane_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instane_id);

        try {
            this._applet_label.set_style('text-align: left');
            this.set_applet_icon_symbolic_name("audio-headphones"); //"media-playback-start");

            this.startPresent = 0;
            this.numRecentSongs = 0;
            this.recentSongs = [];
            this.first_line = "";
            this.songItem = new PopupMenu.PopupMenuItem(_(""));
            this._refresh();
            this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refresh));

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, orientation);
            this.menuManager.addMenu(this.menu);

            this.startStop = new PopupMenu.PopupMenuSection(_("startStop"));
            this.commandSection = new PopupMenu.PopupMenuSection(_("Commands"));
            this.submenu = new PopupMenu.PopupSubMenuMenuItem(_("Recent Music"));

            this.menu.addMenuItem(this.startStop);
            this.menu.addMenuItem(this.commandSection);
            this.menu.addMenuItem(this.submenu);

            // add recent songs (unimplemented)
            //            this.addRecentSongs();

            this.initializeButtons();

        } catch (e) {

            global.logError(e);
        }
    },
    initializeButtons: function() {

        this.commandSection.removeAll();

        // play pause
        item = new PopupMenu.PopupIconMenuItem(_("Play/Pause"), "media-playback-pause", St.IconType.SYMBOLIC);
        item.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine(PWD + "/helper.sh p");
        }));
        this.commandSection.addMenuItem(item);

        // next song
        item = new PopupMenu.PopupIconMenuItem(_("Next Song"), "media-skip-forward", St.IconType.SYMBOLIC);
        item.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine(PWD + "/helper.sh n");
        }));
        this.commandSection.addMenuItem(item);

        // favorite
        item = new PopupMenu.PopupIconMenuItem(_("Favorite"), "emblem-favorite", St.IconType.SYMBOLIC);
        item.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine(PWD + "/helper.sh +");
        }));
        this.commandSection.addMenuItem(item);

    },
    addStartButton: function() {
        try {
            if (this.first_line == "Not running" && this.startPresent != 1) {
                this.startStop.removeAll();
                startItem = new PopupMenu.PopupMenuItem("Start Pianobar");
                startItem.connect('activate', Lang.bind(this, function() {
                    Util.spawnCommandLine(PWD + "/helper.sh start");
                }));
                this.startStop.addMenuItem(startItem);
                this.startPresent = 1;
                //                this.menu.addMenuItem(this.startStop);
            } else if (this.first_line != "Not running" && this.startPresent != 2) {
                this.startStop.removeAll();
                startItem = new PopupMenu.PopupMenuItem("Stop Pianobar");
                startItem.connect('activate', Lang.bind(this, function() {
                    Util.spawnCommandLine(PWD + "/helper.sh stop");
                }));
                this.startStop.addMenuItem(startItem);
                this.startPresent = 2;
                //                this.menu.addMenuItem(this.startStop);
            }
        } catch (e) {
            global.logError(e);
        }
    },
    addRecentSongs: function() {
        try { //if (this.songItem.getLabel() !== this.first_line) {
            //this.songItem = new PopupMenu.PopupMenuItem(this.first_line);
            let pres = 0;
            let l = this.recentSongs.length;
            for (let i = 0; i < l; i++) {
                if (this.first_line === this.recentSongs[i].name) {
                    pres = 1;
                }
            }
            if (pres == 0) {
                if (this.first_line.indexOf(">>>") == -1) {
                    this.recentSongs.push({
                        name: this.first_line
                    });
                }
            }

            if (l != this.recentSongs.length) {
                this.submenu.menu.removeAll();
                for (let i = l; i >= 0; i--) {
                    if (this.numRecentSongs <= 5) {
                        this.submenu.menu.addMenuItem(new PopupMenu.PopupMenuItem(this.recentSongs[i].name));
                        this.numRecentSongs++;
                    }
                }
                this.numRecentSongs = 0;
            }
        } catch (e) {
            global.logError(e);
        }
        // }
    },
    _refresh: function() {
        this.addStartButton();

        Util.spawnCommandLine(PWD + "/helper.sh working");
        this.first_line = Cinnamon.get_file_contents_utf8_sync('/home/bobby/.config/pianobar/nowplaying').split("\n")[0];
        this.second_line = Cinnamon.get_file_contents_utf8_sync('/home/bobby/.config/pianobar/nowplaying').split("\n")[1];
        let favorite = Cinnamon.get_file_contents_utf8_sync('/home/bobby/.config/pianobar/nowplaying').split("\n")[2];
        if (favorite == '1') {
            this.first_line = this.first_line + " <3";
            this.second_line = this.second_line + " <3";
        }
        this.set_applet_tooltip(this.second_line);
        this.set_applet_label(this.first_line);

        this.addRecentSongs();
        return true;
    },

    on_applet_removed_from_panel: function() {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
    },

    on_applet_clicked: function() {
        this.menu.toggle();
    },
};

function main(metadata, orientation, panel_height, instance_id) {
    let myApplet = new MyApplet(orientation, panel_height, instance_id);
    return myApplet;
}

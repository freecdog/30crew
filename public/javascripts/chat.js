/**
 * Created by jaric on 31.07.14.
 */

(function($) {
    $.chat = {};

    // Models

    $.chat.Lines = Backbone.Model.extend({
        urlRoot: '/api/dices',
        //idAttribute: 'id',
        defaults: {
            '_id':  null,
            status: 0
        },

        initialize: function() {
            // localStorage - sync values among all tabs
            // sessionStorage - keep values only in one tab
            this.storage = localStorage; //document.cookie; //localStorage; //sessionStorage;

            this.updateRate = 1000; // ms
            this.lastUpdateTime = 0;

            this.restartListener();
            this.statusChanged();
        },

        restartListener: function(){
            console.log("nothing is here");
            //this.stopListening();
            //this.listenTo(this, 'change:status', this.statusChanged);
            //this.listenTo(this, 'change:rerolled', this.statusChanged);
        },

        statusChanged: function(){
            console.log("nothing is here");
            /*console.log("status changed");
            var needUpdate = true;
            var status = this.attributes.status;
            if (status == 0) {
                this.urlRoot = '/api/connectPlayer';

                // if pushing restart button and there is still a game (status == 20) update rate become much more than 2 sec
                // with this restartListener, problem become smaller, but still not gone
                this.restartListener();
            } else if (status == 10) {
                this.urlRoot = '/api/findGame';
            } else if (status == 20) {
                this.updateDices();
                this.urlRoot = '/api/rounds/' + this.attributes._id;
            } else if (status == 70) {
                this.urlRoot = '/api/giveup';
            } else if (status == 90) {
                needUpdate = false;
                console.log("game is over");
                //this.urlRoot = '/api/rounds/' + this.attributes._id;
            } else {
                needUpdate = false;
                console.warn("unknown game status:",this.attributes.status, this);
            }
            if (needUpdate){
                this.updateModel();
            }*/
        },
        updateModel: function(){
            console.log("nothing is here");
            /*var self = this;
            // if there are urlRoot and attributes.id it will be fetched urlRoot + / + id
            if (this.attributes.status != 20) {
                console.log("going to fetch", this.urlRoot);
            }
            this.fetch({
                success: function(mdl, values){
                    //console.log("fetched:", mdl, values);
                    if (values.status != null && mdl._previousAttributes.status != values.status) {
                        console.log("fetched new status:", values.status != null && mdl._previousAttributes.status != values.status, values.status);
                    } else {
                        console.log("fetched new status:", values.status != null && mdl._previousAttributes.status != values.status);
                    }
                    var status = self.attributes.status;
                    if (status == 0) {
                        self.changeStatus(10);
                    } else if (status == 10) {
                        if (new Date() - self.lastUpdateTime > self.updateRate) {
                            self.lastUpdateTime = new Date();
                            setTimeout(function () {
                                self.updateModel();
                            }, self.updateRate);
                        } else {
                            console.log("going to update too early", status);
                        }
                    } else if (status == 20) {
                        //console.log("process fetched:", mdl, values);
                        // there were a problem about twice fetching, but with this if it looks fine
                        if (new Date() - self.lastUpdateTime > self.updateRate) {
                            self.lastUpdateTime = new Date();
                            setTimeout(function(){
                                self.updateModel();
                            }, self.updateRate);
                        } else {
                            console.log("going to update too early", status);
                        }
                    } else if (status == 90) {
                        if (self._previousAttributes.status == 70) {
                            self.changeStatus(0);
                        }
                        // refresh (f5) behaviour when game already ended
                        if (self.attributes.combinations.length == 0) {
                            var ind = self.getOwnPlayerIndex();
                            var rlen = self.attributes.rounds[ind].length;
                            self.setDices(self.attributes.rounds[ind][rlen-1].dices);
                        }
                    }
                },
                error: function(mdl, values, xhr){
                    var status = self.attributes.status;
                    console.warn("actually error", status);
                    if (status == 10) {
                        if (values.status == 200) {
                            console.warn("there were case with fetching here, but now it's moved to success");
                        } else {
                            console.error("Connection eRRoRR", mdl, values, xhr);
                        }
                    } else if (status == 70) {
                        self.changeStatus(0);
                    } else if (status == 90) {
                        if (self._previousAttributes.status == 70) {
                            self.changeStatus(0);
                        }
                    } else {
                        console.error("Connection error", mdl, values, xhr);
                    }
                }
            });*/
        },

        // storage
        addValue: function(name,value){
            this.storage.setItem(name, value);
        },
        getValue: function(name){
            return this.storage.getItem(name);
        },
        existValue: function(name){
            return this.storage.getItem(name) != null;
        },
        removeValue: function(name){
            this.storage.removeItem(name);
        }
    });

    // Views

    $.chat.RestartButton = Backbone.View.extend({
        tagName: 'div',
        className: 'restartGameButton',
        events: {
            "click": "clicked"
        },
        clicked: function(){
            console.log("going to restart");
            $.chat.app.doRestart();
        },
        buttonTemplate: _.template("[restart]"),
        render: function() {
            this.$el.empty();
            this.$el.append(this.buttonTemplate());
            return this;
        }
    });
    $.chat.NamesView = Backbone.View.extend({
        tagName: 'div',
        className: 'namesView',
        initialize: function(){
            this.listenTo(this.model, "change:names", this.listener);
        },
        listener: function(){
            this.render();
        },
        events: {
            "click": "clicked"
        },
        clicked: function(e){
            console.log("names:", e.target.title, this.model.attributes.names, e);
            $.chat.app.doViewAnotherModel(parseInt(e.target.title));
        },
        nameTemplate: _.template('<span title="<%= index %>"> <%= name %> </span>'),
        ownNameTemplate: _.template('<b><span title="<%= index %>"> <%= name %> </span></b>'),
        render: function(){
            this.$el.empty();
            if (this.model.attributes != null && this.model.attributes.names != null) {
                var ownIndex = this.model.getOwnPlayerIndex();
                for (var i = 0; i < this.model.attributes.names.length; i++){
                    if (i == ownIndex){
                        this.$el.append(this.ownNameTemplate({name: this.model.attributes.names[i], index: i}));
                    } else {
                        this.$el.append(this.nameTemplate({name: this.model.attributes.names[i], index: i}));
                    }
                }
            }
            return this;
        }
    });
    $.chat.InputView = Backbone.View.extend({
        tagName: 'div',
        className: 'inputView',
        initialize: function(){
            this.$el.attr('contentEditable',true);
            //this.listenTo(this.options.parent.model, "change:names", this.listener);
        },
        listener: function(){
            //this.setValue(this.getName(this.options.parent.model));
        },
        events: {
            // https://developer.mozilla.org/en-US/docs/Web/Events
            "input": "clicked"
        },
        clicked: function(event){
            console.log(this.getValue());
        },
        getValue: function(){
            return this.$el[0].textContent;
        },
        setValue: function(value){
            this.$el[0].textContent = value;
        },
        render: function(){
            this.$el.empty();
            this.$el.append("asdf");
            return this;
        }
    });

    // Router

    // looks like main application class
    $.chat.Router = Backbone.Router.extend({
        routes: {
            "": "chat"
        },
        initialize: function(){
            console.log("1. app init");
        },
        chat: function(){
            console.log("2. app route");

            var $body = $('body');

            this.linesModel = new $.chat.Lines();

            //var nameView = new $.chat.NamesView({model: this.linesModel});
            //$body.append(nameView.render().el);

            var inputView = new $.chat.InputView({model: this.linesModel});
            $body.append(inputView.render().el);
        },

        doRestart: function(index){
            this.linesModel.restart(index);
        }
    });

    // App

    $.chat.app = null;

    $.chat.bootstrap = function(){
        $.chat.app = new $.chat.Router();
        Backbone.history.start({pushState: true});
    };
})(jQuery);
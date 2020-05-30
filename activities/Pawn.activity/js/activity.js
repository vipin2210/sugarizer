// Rebase require directory
requirejs.config({
  baseUrl: "lib",
  paths: {
    activity: "../js"
  }
});

// Vue main app
var app = new Vue({
  el: '#app',
  components: {
    'pawn': Pawn,
  },
  data: {
    currentenv: null,
    SugarL10n: null,
    SugarPresence: null,
    displayText: '',
    pawns: [],
    l10n: {
      stringAddPawn: '',
      stringTutoExplainTitle: '',
      stringTutoExplainContent: '',
      stringTutoAddTitle: '',
      stringTutoAddContent: '',
      stringTutoBackgroundTitle: '',
      stringTutoBackgroundContent: '',
    }
  },
  mounted: function() {
    this.SugarL10n = this.$refs.SugarL10n;
    this.SugarPresence = this.$refs.SugarPresence;

  },
  methods: {
    initialized: function() {
      // Initialize Sugarizer
      //this.$refs.SugarActivity.setup();
      this.currentenv = this.$refs.SugarActivity.getEnvironment();

      /*Set the event listener here */
      this.SugarL10n.$on('localized', this.localized());
    },

    // Handles localized event
    localized: function() {
      this.displayText = this.SugarL10n.get("Hello", {
        name: this.currentenv.user.name
      });
      this.SugarL10n.localize(this.l10n);
    },
    onAddClick: function(event) {
      for (var i = 0; i < event.count; i++) {
        this.pawns.push(this.currentenv.user.colorvalue);
        this.displayText = this.SugarL10n.get("Played", {
          name: this.currentenv.user.name
        });

        if (this.SugarPresence.isConnected()) {
          var message = {
            user: this.SugarPresence.getUserInfo(),
            content: {
              action: 'update',
              data: this.currentenv.user.colorvalue
            }
          }
          this.SugarPresence.sendMessage(message);
        }
      }
    },

    onStop: function() {
      // Save current pawns in Journal on Stop
      var context = {
        pawns: this.pawns
      };
      this.$refs.SugarJournal.saveData(context);
    },

    onJournalNewInstance: function() {
      console.log("New instance");
    },

    onJournalDataLoaded: function(data, metadata) {
      console.log("Existing instance");
      this.pawns = data.pawns;
    },

    onJournalLoadError: function(error) {
      console.log("Error loading from journal");
    },

    insertBackground: function() {
      var filters = [{
          mimetype: 'image/png'
        },
        {
          mimetype: 'image/jpeg'
        }
      ];
      this.$refs.SugarJournal.insertFromJournal(filters, function(data, metadata) {
        // Do nothing at the moment
        document.getElementById("app").style.backgroundImage = `url(${data})`;
      })
    },

    onHelp: function() {
      var steps = [{
          element: "",
          orphan: true,
          placement: "bottom",
          title: this.l10n.stringTutoExplainTitle,
          content: this.l10n.stringTutoExplainContent
        },
        {
          element: "#add-button",
          placement: "right",
          title: this.l10n.stringTutoAddTitle,
          content: this.l10n.stringTutoAddContent
        },
        {
          element: "#insert-button",
          placement: "bottom",
          title: this.l10n.stringTutoBackgroundTitle,
          content: this.l10n.stringTutoBackgroundContent
        }
      ];
      this.$refs.SugarTutorial.show(steps);
    },

    onNetworkDataReceived: function(msg) {
      console.log("msg");
      // Handles the data-received event
      switch (msg.content.action) {
        case 'init':
          this.pawns = msg.content.data;
          break;
        case 'update':
          this.pawns.push(msg.content.data);
          this.displayText = this.SugarL10n.get("Played", {
            name: msg.user.name
          });
          break;
      }

    },

    onNetworkUserChanged: function(msg) {
      // Handles the user-changed event
      console.log("ok");
      if (this.SugarPresence.isHost) {
        this.SugarPresence.sendMessage({
          user: this.SugarPresence.getUserInfo(),
          content: {
            action: 'init',
            data: this.pawns
          }
        });
      }
    },
  }
});

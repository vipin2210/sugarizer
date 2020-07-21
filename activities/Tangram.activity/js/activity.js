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
    'game': Game,
    'result': Result,
  },
  data: {
    currentScreen: "",
    strokeColor: '#f0d9b5',
    fillColor: '#b58863',
    currentenv: null,
    SugarL10n: null,
    SugarPresence: null,
    SugarJournal: null,
    sugarPopup: null,
    mode: 'non-timer',
    score: 0,
    scores: [],
    tangramCategory: 'standard',
    level: 0,
    tangramType: 1,
    timer: null,
    clock: {
      active: false,
      time: 0,
      initial: 0,
      type: 0,
    },
    puzzles: [],
    pNo: 0,
    gameOver: null,
    isTargetAcheived: false,
    hintNumber: 0,
    showHint: false,
    scale: 1,
    stage: {
      width: 1,
      height: 1,
    },
    tanColors: ["blue", "purple", "red", "green", "yellow", "yellow"],
  },
  watch: {
    currentScreen: function() {
      var vm = this;
      if (vm.currentScreen === 'game') {
        vm.newGame();
        //vm.startClock();
      }
    },
  },
  methods: {
    initialized: function() {
      let vm = this;
      // Initialize Sugarizer
      vm.currentenv = vm.$refs.SugarActivity.getEnvironment();

      document.getElementById('app').style.background = vm.currentenv.user.colorvalue.stroke;
      vm.strokeColor = vm.currentenv.user.colorvalue.stroke;
      vm.fillColor = vm.currentenv.user.colorvalue.fill;

      vm.currentScreen = "game";

    },

    newGame: function() {
      let vm = this;
      vm.score = 0;
      vm.scores = [];
      vm.puzzles = [];
      vm.pNo = 0;
      vm.hintNumber = 0;
      vm.isTargetAcheived = false;
      vm.generateTangram();
    },

    generateTangram: function() {
      generating = true;
      let vm = this;
      let tang,tangramName;

      if (vm.tangramType === 1) {
        let tangram = standardTangrams[Math.floor(Math.random() * (standardTangrams.length - 1)) + 1];
        tang = tangram.tangram;
        tangramName = tangram.name;
      } else if (vm.tangramType === 2) {
        let generatedTangrams = generateTangrams(5);
        tang = generatedTangrams[0];
        tangramName = "Random";
      } else if (vm.tangramType === 3) {
        let tangram = standardTangrams[0];
        tang = tangram.tangram;
        tangramName = tangram.name;
      }

      generating = false;
      console.log(tang);
      let puzzle = {
        name: tangramName,
        tangram: {
          ...tang
        },
        targetTans: [],
        outline: [],
      };

      tang.positionCentered();

      let target = [];
      let targetTans = [];
      for (let i = 0; i < tang.tans.length; i++) {
        let targetTan = {
          x: 100,
          y: 100,
          offsetX: 100,
          offsetY: 100,
          anchor: null,
          pointsObjs: [],
          tanObj: new Tan(tang.tans[i].tanType, tang.tans[i].anchor.dup(), tang.tans[i].orientation),
          tanType: tang.tans[i].tanType,
          orientation: tang.tans[i].orientation,
          points: [],
          stroke: vm.fillColor,
          strokeEnabled: true,
          strokeWidth: 0.3,
          fill: vm.strokeColor,
          closed: true,
          lineJoin: 'round',
          shadowColor: 'black',
          shadowBlur: 10,
          shadowOpacity: 0.8,
          shadowEnabled: false,
        }

        let points = [...tang.tans[i].getPoints()];
        let center = tang.tans[i].center();

        let floatPoints = [];
        let pointsObjs = [];
        for (let j = 0; j < points.length; j++) {
          let tmpPoint = points[j].dup();
          pointsObjs.push(tmpPoint);
          floatPoints.push(tmpPoint.toFloatX());
          floatPoints.push(tmpPoint.toFloatY());
        }
        targetTan.offsetX = center.toFloatX();
        targetTan.offsetY = center.toFloatY();
        targetTan.x = targetTan.offsetX;
        targetTan.y = targetTan.offsetY;
        targetTan.points = floatPoints;
        targetTan.anchor = tang.tans[i].anchor.dup();
        targetTan.pointsObjs = pointsObjs;
        targetTan.stroke = vm.level === 0 ? vm.fillColor : vm.strokeColor;
        target.push(targetTan);
      }
      puzzle.targetTans = target;
      puzzle.outline = [...tang.outline]
      vm.puzzles = [puzzle];

      vm.centerTangram();
    },

    centerTangram: function() {
      let vm = this;
      let targetTans = vm.puzzles[vm.pNo].targetTans;
      let scale = vm.scale;
      let dx = vm.stage.width / (3 * scale) - 30;
      let dy = vm.stage.height / (2 * scale) - 30;

      for (let index = 0; index < targetTans.length; index++) {
        let points = [...targetTans[index].tanObj.getPoints()];
        let center = targetTans[index].tanObj.center();
        let floatPoints = [];

        for (let j = 0; j < points.length; j++) {
          let tmpPoint = points[j].dup();
          tmpPoint.x.add(new IntAdjoinSqrt2(dx, 0));
          tmpPoint.y.add(new IntAdjoinSqrt2(dy, 0));
          floatPoints.push(tmpPoint.toFloatX());
          floatPoints.push(tmpPoint.toFloatY());
        }
        vm.$set(vm.puzzles[vm.pNo].targetTans[index], 'points', floatPoints);
        vm.$set(vm.puzzles[vm.pNo].targetTans[index], 'offsetX', center.toFloatX() + dx);
        vm.$set(vm.puzzles[vm.pNo].targetTans[index], 'offsetY', center.toFloatY() + dy);
        vm.$set(vm.puzzles[vm.pNo].targetTans[index], 'x', center.toFloatX() + dx);
        vm.$set(vm.puzzles[vm.pNo].targetTans[index], 'y', center.toFloatY() + dy);
      }

    },

    onConfigChanged: function(data) {
      this.scale = data.scale;
      this.stage.width = data.stageWidth;
      this.stage.height = data.stageHeight;
    },

    onRemoveTangramBorders: function(data) {
      let vm = this;
      if (vm.gameOver) {
        return;
      }
      for (var i = 0; i < 7; i++) {
        vm.puzzles[vm.pNo].targetTans[i].strokeEnabled = true;
      }
      let remaining = [true, true, true, true, true, true, true];
      for (var i = 0; i < 7; i++) {
        let targetTanIndex = data[i];
        if (targetTanIndex != -1) {
          vm.puzzles[vm.pNo].targetTans[targetTanIndex].strokeEnabled = false;
          remaining[targetTanIndex] = false;
        }
      }
      for (var i = 0; i < remaining.length; i++) {
        if (remaining[i]) {
          vm.hintNumber = i;
          break;
        }
      }
    },

    onTangramStatus: function(data) {
      let vm = this;
      if (vm.gameOver) {
        return;
      }
      vm.isTargetAcheived = data;

      for (var i = 0; i < vm.puzzles[vm.pNo].targetTans.length; i++) {
        vm.$set(vm.puzzles[vm.pNo].targetTans[i], 'shadowEnabled', data);
      }
      if (data) {
        vm.gameOver = 'solved';
        for (var i = 0; i < 7; i++) {
          vm.puzzles[vm.pNo].targetTans[i].strokeEnabled = false;
        }
      }

    },

    handleRestartButton: function() {
      var vm = this;
      if (vm.currentScreen === 'game') {
        //vm.stopClock();
        //vm.$set(vm.slots, vm.qNo, []);
        vm.score += 0;
        vm.scores.push(0)
        //vm.pushTimeTaken();
        vm.gameOver = null;
        vm.newGame();
      } else {
        //change currentScreen
        vm.currentScreen = "game";
      }
    },

    handlePassButton: function () {
      var vm = this;

      if (vm.currentScreen === 'game') {
        //stop timer
        vm.score += 0;
        vm.scores.push(0)
        //vm.pushTimeTaken();
        //cloning array
        if (vm.mode === 'non-timer') {
          //vm.stopClock();
          /*vm.slots = [
            []
          ];*/
          for (var i = 0; i < vm.puzzles[vm.pNo].targetTans.length; i++) {
            let color = vm.tanColors[vm.puzzles[vm.pNo].targetTans[i].tanType];
            vm.$set(vm.puzzles[vm.pNo].targetTans[i], 'fill', color);
            vm.$set(vm.puzzles[vm.pNo].targetTans[i], 'strokeEnabled', false);
          }
          vm.gameOver = 'passed';
        } else {
          //go to next question in question set for timer mode
          /*vm.$set(vm.slots, vm.qNo, []);
          vm.qNo++;
          vm.$set(vm.slots, vm.qNo, []);
          */
        }

      }
    },

    onTangramTypeSelected: function (evt) {
      let vm = this;
      if (vm.gameOver) {
        return;
      }
      vm.tangramType = evt.index;
      vm.selectTangramTypeItem(evt.index);
      vm.newGame();

    },

    selectTangramTypeItem: function(number) {
      let elems = [
        document.getElementById('standard-type-button'),
        document.getElementById('random-type-button'),
        document.getElementById('custom-type-button')
      ]

      for (let i = 1; i <= elems.length; i++) {
        let elem = elems[i-1];
        if (i === number) {
          elem.classList.add('palette-item-selected');
        } else {
          elem.classList.remove('palette-item-selected');
        }
      }
    },

    onDifficultySelected: function(evt) {
      var vm = this;
      if (vm.gameOver) {
        return;
      }
      vm.level = evt.index;
      let color = vm.level === 0 ? vm.fillColor : vm.strokeColor;
      for (var i = 0; i < vm.puzzles[vm.pNo].targetTans.length; i++) {
        vm.$set(vm.puzzles[vm.pNo].targetTans[i], 'stroke', color);
      }
      vm.selectDifficultyItem(evt.index);
      vm.newGame();
    },

    selectDifficultyItem: function(number) {
      if (number === 0) {
        document.getElementById('easy-button').classList.remove("palette-button-notselected");
        document.getElementById('medium-button').classList.add("palette-button-notselected");
      } else {
        document.getElementById('medium-button').classList.remove('palette-button-notselected');
        document.getElementById('easy-button').classList.add('palette-button-notselected');
      }
    },

    onHint: function() {
      let vm = this;
      if (vm.level === 0 || vm.gameOver) {
        return;
      }
      let color = vm.tanColors[vm.puzzles[vm.pNo].targetTans[vm.hintNumber].tanType];
      vm.$set(vm.puzzles[vm.pNo].targetTans[vm.hintNumber], 'fill', color);
      vm.$set(vm.puzzles[vm.pNo].targetTans[vm.hintNumber], 'stroke', color);
      //vm.puzzles[vm.pNo].targetTans[vm.hintNumber].strokeEnabled = false;
      //vm.puzzles[vm.pNo].targetTans[vm.hintNumber].shadowEnabled = true;
      vm.showHint = true;

      setTimeout(() => {
        vm.$set(vm.puzzles[vm.pNo].targetTans[vm.hintNumber], 'fill', vm.strokeColor);
        vm.$set(vm.puzzles[vm.pNo].targetTans[vm.hintNumber], 'stroke', vm.strokeColor);
        //vm.puzzles[vm.pNo].targetTans[vm.hintNumber].strokeEnabled = true;
        //vm.puzzles[vm.pNo].targetTans[vm.hintNumber].shadowEnabled = false;
        vm.showHint = false;
      }, 1000);

    }

  }
});

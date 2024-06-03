<template>
  <v-app>
    <v-layout>
      <!-- navigationDrawer -->
      <v-navigation-drawer
        floating
        permanent
        theme="dark"
      >
        <v-list
          v-model:selected="navValue"
          nav
          mandatory
        >
          <!-- md2json -->
          <v-list-item
            prepend-icon="mdi-code-json"
            title="markdown → json"
            active-class="test"
            value="md2json"
          />
          <!-- json2md -->
          <v-list-item
            prepend-icon="mdi-language-markdown-outline"
            title="json → markdown"
            value="json2md"
          />
          <!-- markdownPreview -->
          <v-list-item
            prepend-icon="mdi-eye-settings"
            title="markdown preview"
            value="markdownPreview"
          />
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <v-container>
          <v-row>
            <!-- 入力側 -->
            <v-col>
              <!-- title -->
              <v-row dense>
                <v-col>
                  <div
                    :class="{
                      'md-background': navValue[0] === 'md2json' || navValue[0] === 'markdownPreview',
                      'json-background': navValue[0] === 'json2md'
                    }"
                  >
                    {{ inputTitle[navValue[0]] }}
                  </div>
                </v-col>
              </v-row>
              <!-- value -->
              <v-row dense>
                <v-col>
                  <v-textarea
                    v-model="inputText[navValue[0]]"
                    variant="outlined"
                    auto-grow
                    rows="10"
                  />
                </v-col>
              </v-row>
            </v-col>
            <!-- md2json/json2mdで変換ボタンが必要なもの -->
            <template v-if="navValue[0] !== 'markdownPreview'">
              <!-- 変換ボタン -->
              <v-col cols="auto">
                <v-btn
                  color="#10727d"
                  @click="change"
                >
                  <span>変換</span>
                </v-btn>
              </v-col>
              <!-- output -->
              <v-col>
                <!-- title -->
                <v-row dense>
                  <v-col>
                    <div
                      :class="{
                        'md-background': navValue[0] === 'json2md',
                        'json-background': navValue[0] === 'md2json'
                      }"
                    >
                      {{ outputTitle[navValue[0]] }}
                    </div>
                  </v-col>
                </v-row>
                <!-- value -->
                <v-row dense>
                  <v-col v-if="navValue[0] === 'md2json'">
                    <v-textarea
                      :model-value="outputText[navValue[0]] ? JSON.stringify(outputText[navValue[0]], null, 2) : ''"
                      variant="outlined"
                      auto-grow
                      readonly
                      rows="10"
                    />
                  </v-col>
                  <v-col v-else>
                    <div
                      style="
                        white-space: pre;
                        border: 1px solid gray;
                        padding: 12px;
                        border-radius: 4px;
                        min-height: 272px;
                      "
                    >
                      {{ outputText[navValue[0]] }}
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </template>

            <!-- リアルタイム更新系 -->
            <template v-else>
              <v-col>
                <!-- value -->
                <v-row dense>
                  <v-col>
                    <VueMarkdown :source="inputText[navValue[0]]" />
                  </v-col>
                </v-row>
              </v-col>
            </template>
          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script>
import VueMarkdown from 'vue-markdown-render'

export default {
  components: { VueMarkdown },
  data: () => ({
    inputText: {
      md2json: '',
      json2md: '',
      markdownPreview: ''
    },
    outputText: {
      md2json: '',
      json2md: '',
      markdownPreview: ''
    },
    inputTitle: {
      md2json: 'markdown',
      json2md: 'json',
      markdownPreview: 'markdown'
    },
    outputTitle: {
      md2json: 'json',
      json2md: 'markdown',
      markdownPreview: 'markdown preview'
    },

    langList: [],
    jsonString: {},
    SHARP_INDEX: 1,
    KEY_INDEX: 2,
    HEADLINE_COUNT: 2,
    sharp: '#',
    stack: [],

    navValue: ['json2md']
  }),
  methods: {
    change() {
      // 初期化
      this.langList = []
      this.outputText[this.navValue[0]] = ''
      this.jsonString = {}

      if (this.navValue[0] == 'md2json') {
        // md2json
        // 言語一覧取得
        this.setLangs(this.inputText[this.navValue[0]])
        // 言語ごと変換
        this.langList.forEach((lang, index) => {
          this.jsonString[lang] = this.md2json(index, this.inputText[this.navValue[0]])
        })
        // JsonTextを格納
        this.outputText[this.navValue[0]] = this.jsonString
      } else {
        // json2md
        this.json2md(this.inputText[this.navValue[0]])
      }
    },

    // ====================================
    // md2json
    // ====================================
    md2json(index, mdString) {
      let result = {}
      let tableHeadline = 0
      let currentLevel = 0
      let stack = [result]

      //  見出し確認用（シャープと文字列）
      // 改行区切りで1行ずつ確認
      for (let oneLine of mdString.split(/\n/)) {
        if (oneLine.trim() == '') {
          // 空文字の場合は処理なし
          continue
        }
        oneLine = oneLine.trim()
        //  見出し確認用（シャープと文字列）
        const isHeadingRegExp = /(^#+)\s*(.*?)\s*$/
        // テーブル部分を抜き出すために見出し判定
        const isHeading = oneLine.match(isHeadingRegExp)

        let current_dict = {}

        // 見出しの場合
        if (isHeading) {
          tableHeadline = 0
          // シャープの数カウント(Jsonの階層決定)
          const sharpLength = isHeading[this.SHARP_INDEX].length
          // 見出し抜き出し(JsonのKey決定)
          let key = isHeading[this.KEY_INDEX]

          //  現在行の見出しレベルに合わせて階層を戻る
          while (sharpLength <= currentLevel) {
            stack.pop()
            currentLevel = currentLevel - 1
          }
          current_dict = stack[stack.length - 1]
          current_dict[key] = {}
          stack.push(current_dict[key])
          currentLevel += 1
        } else {
          //  テーブルのヘッダとハイフンの行を読み飛ばす
          if (tableHeadline < this.HEADLINE_COUNT) {
            tableHeadline += 1
            continue
          }
          let params = oneLine.trim().split('|')
          //  先頭の空欄とkeyの欄を削除
          let param_key = params[1].trim()
          let array = []
          for (let i = 2; i < params.length; i++) {
            array.push(params[i])
          }
          current_dict = stack[stack.length - 1]
          current_dict[param_key] = array[index].trim()
        }
      }
      return result
    },
    // テーブルの形から設定言語を取得
    setLangs(mdString) {
      let tableHeadline = 0
      // 改行区切りで1行ずつ確認
      for (let oneLine of mdString.split(/\n/)) {
        // 初めのテーブルのkeyのみ確認
        if (this.langList.length > 0) {
          break
        }
        if (oneLine.trim() == '') {
          // 空文字の場合は処理なし
          continue
        }
        // 前後の空白削除
        oneLine = oneLine.trim()
        //  見出し確認用（シャープと文字列）
        const isHeadingRegExp = /(^#+)\s*(.*?)\s*$/
        // テーブル部分を抜き出すために見出し判定
        const isHeading = oneLine.match(isHeadingRegExp)
        if (!isHeading) {
          // 見出しではない場合（テーブル）
          if (tableHeadline == 0) {
            // ヘッダーのみ読み取り
            const langs = oneLine.trim().split('|')
            //  先頭の空欄とkeyの欄、末尾の空欄を削除
            for (let lang of langs) {
              lang = lang.trim()
              if (lang == 'key' || lang == '') {
                continue
              }
              if (!this.langList.includes(lang)) {
                // 未設定のKeyの場合設定
                this.langList.push(lang)
              }
            }
            tableHeadline = tableHeadline + 1
          }
        } else {
          // 見出しなので、テーブルの行数チェックリセット
          tableHeadline = 0
        }
      }
    },

    // ====================================
    // json2md
    // ====================================
    json2md(jsonText) {
      const jsonString = JSON.parse(jsonText)
      this.langList = Object.keys(jsonString)
      const jsonValueString = jsonString[this.langList[0]]
      const level = 1
      const markdownValue = this.convert_contents(jsonValueString, '', level)
      this.outputText[this.navValue[0]] = markdownValue
    },
    convert_contents(jsonValueString, markdownValue, level) {
      let isNotPrinted = true
      const keys = Object.keys(jsonValueString)

      keys.forEach((key) => {
        if (jsonValueString !== null && typeof jsonValueString[key] == 'object') {
          // objectの場合
          isNotPrinted = true
          markdownValue += this.sharp.repeat(level) + ' ' + key + '\n\n'
          level += 1
          this.stack.push(key)
          markdownValue = this.convert_contents(jsonValueString[key], markdownValue, level)
          this.stack.pop(-1)
          level -= 1
        } else {
          // stringの場合
          if (isNotPrinted) {
            markdownValue += '| key | '
            for (let l of this.langList) {
              markdownValue += l + ' | '
            }
            markdownValue = markdownValue.trim() + '\n'
            markdownValue += '| --- | '
            this.langList.forEach(() => {
              markdownValue += '-- | '
            })
            isNotPrinted = false
            markdownValue = markdownValue.trim() + '\n'
            markdownValue += '| ' + key + ' | '
            markdownValue += this.getLangValue(this.stack, key)
            markdownValue = markdownValue.trim() + '\n\n'
          } else {
            markdownValue = markdownValue.trim() + '\n'
            markdownValue += '| ' + key + ' | '
            markdownValue += this.getLangValue(this.stack, key)
            markdownValue = markdownValue.trim() + '\n\n'
          }
        }
      })
      return markdownValue
    },
    getLangValue(stack, key) {
      let md = ''
      let langJson = ''
      for (const lang of this.langList) {
        // 言語まで絞った入力Json
        langJson = JSON.parse(this.inputText[this.navValue[0]])[lang]
        let value = langJson
        for (const s of stack) {
          value = value[s]
        }
        let r = String(value[key])
        md += r + ' | '
      }
      return md
    }
  }
}
</script>
<style>
.md-background {
  background-color: #873a3a;
  color: #ffffff;
  padding: 12px;
}
.json-background {
  background-color: #191c57;
  color: #ffffff;
  padding: 12px;
}
.test {
  color: red;
}
</style>

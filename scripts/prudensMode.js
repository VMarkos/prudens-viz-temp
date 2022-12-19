CodeMirror.defineSimpleMode("simplemode", {
    // The start state contains the rules that are initially used
    start: [
      // The regex matches the token, the token property contains the type
      {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
      // You can match multiple tokens at once. Note that the captured
      // groups must span the whole string in this case
      {regex: /(([A-Z]\w*)(?=(\s*,|\))))/,
       token: "variable-3"},
      {regex: /(([a-z]\w*)(?=(\s*,|\)|(\s+implies))))/,
       token: "variable-2"},
      // Rules are matched in the order in which they appear, so there is
      // no ambiguity between this one and the one above
      {regex: /(implies|::|true|@KnowledgeBase|@Knowledge|@Procedures|@Code)/,
       token: "keyword"},
      {regex: /(\w+)(?=(\s*)(::))/, token: "variable-3"},
      {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
       token: "number"},
      {regex: /\/\/.*/, token: "comment"},
      {regex: /(([a-z]\w*)(?=(\())|(\?=))/, token: "atom"},
      // A next property will cause the mode to move to a different state
      {regex: /\/\//, token: "comment"},
      {regex: /[-+\/*=<>!#]+/, token: "operator"},
      // indent and dedent properties guide autoindentation
      {regex: /[\{\[\(]/, indent: true},
      {regex: /[\}\]\)]/, dedent: true},
      {regex: /[a-z$][\w$]*/, token: "variable"},
      // You can embed other modes with the mode property. This rule
      // causes all code between << and >> to be highlighted with the XML
      // mode.
      {regex: /<</, token: "meta", mode: {spec: "xml", end: />>/}}
    ],
    // The multi-line comment state.
    comment: [
      {regex: /.*?\*\//, token: "comment", next: "start"},
      {regex: /.*/, token: "comment"}
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
      dontIndentStates: ["comment"],
      lineComment: "//"
    }
  });
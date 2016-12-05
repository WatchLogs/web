"use strict"

openpgp.config.aead_protect = true
var hkp = new openpgp.HKP('https://pgp.mit.edu')
var keyring = new openpgp.Keyring()

// Print a key
function printKey () {
  let keyid = printKeyid(this.primaryKey.getKeyId())
  let userid = printUser(this.getPrimaryUser().user)
  return keyid + ' ' + userid
}
openpgp.key.toString = printKey

function printKeyid (keyid) {
  return keyid.toHex()
}
openpgp.Keyid.prototype.toString = openpgp.Keyid.prototype.toHex

function printUser (user) {
  return user.userId.userid
}

function printSignature (signature) {
  if (signature.valid) {
    return 'Signed by ' + signature.email
  } else {
    return 'Invalid signature'
  }
}

function getFullSignature (signature) {
  let key = keyring.getKeysForId(printKeyid(signature.keyid))[0]
  let user = key.getPrimaryUser().user
  signature.user = user
  signature.email = printUser(user).match(/<(.*)>/)[1]
  return signature
}

function printAnything (obj) {
  let funs = {
    'String': x => x,
    'Key': printKey,
    'User': printUser,
    'Keyid': printKeyid
  }
  return funs[obj.constructor.name](obj)
}

// Find a (public) key on a server (note - how can you trust the PGP server?)
function lookup (query) {
  console.log(query)
  return new Promise((resolve, reject) => {
    hkp.lookup({ query: query }).then(function(keys) {
      keyring.publicKeys.importKey(keys)
      let key = openpgp.key.readArmored(keys).keys[0]
      // Yes, this is a bit hacky
      key.toString = printKey
      resolve(key)
    })
  })
}
lookup.usage = 'lookup *email*'
lookup.doc = "Look up *email*'s public key and add it to the browser keyring."

// Generate your own keypair and save to browser localStorage
function keygen (name, email) {
  // Generate keypairs for Alice and Bob
  return openpgp.generateKey({
    userIds: [{
      name: name,
      email: email
    }]
  }).then( ({ privateKeyArmored, publicKeyArmored }) => {
    keyring.publicKeys.importKey(publicKeyArmored)
    keyring.privateKeys.importKey(privateKeyArmored)
    let key = openpgp.key.readArmored(privateKeyArmored).keys[0]
    key.toString = printKey
    return key
  })
}
keygen.usage = 'keygen *"full name"* *email*'
keygen.doc = 'Generate a key pair in the browser and add it to the browser keyring.'

// List keys in keyring
function list () {
  return new Promise((resolve, reject) => {
    let print = ''
    for (let key of keyring.publicKeys.keys) {
      print += printKey.apply(key) + '\n\n'
    }
    resolve(print)
  })
}
list.usage = 'list'
list.doc = "Prints a list of all the public keys in the browser's keyring."

function locallookup (email) {
  let keys = keyring.publicKeys.getForAddress(email)
  if (keys.length === 0) {
    output('*ERROR key not found for ' + email + '*')
    return
  }
  keys[0].toString = printKey
  return keys[0]
}
locallookup.usage = 'locallookup *email*'
locallookup.doc = "Does the same as 'lookup' but only searches the browser's keyring not the PGP server."

function lookupPrivateKey (email) {
  let keys = keyring.privateKeys.getForAddress(email)
  if (keys.length === 0) {
    output('*ERROR key not found for ' + email + '*')
    return
  }
  keys[0].toString = printKey
  return keys[0]
}

function encrypt (email, msg) {
  // Load Alice's keypair from localstorage
  let privateKey = keyring.privateKeys.keys[0]
  let publicKey = locallookup(email)
  return openpgp.encrypt({
    publicKeys: publicKey,   // NOTE: it's plural...
    data: msg
  }).then(function(encrypted) {
    return encrypted.data
  })
}
encrypt.usage = 'encrypt *email* *"message"*'
encrypt.doc = 'Encrypt a *message* using the public key for *email*. As long as you surround the message in quote marks, the message can contain spaces or stretch multiple lines.'

function decrypt (email, msg) {  
  let privateKey = lookupPrivateKey(email)
  return openpgp.decrypt({
    privateKey: privateKey,
    message: openpgp.message.readArmored(msg)
  }).then(function(decrypted){
    return decrypted.data
  })
}
decrypt.usage = 'decrypt *email* *"message"*'
decrypt.doc = 'Decrypts a *message* using the private key for *email*. Paste the full encrypted message including the -----BEGIN PGP MESSAGE----- and -----END PGP MESSAGE----- lines, in quotes.'

// Sign a message 
function sign (email, msg) {
  // Load keypair from localstorage
  let privateKey = lookupPrivateKey(email)
  let publicKey = privateKey.toPublic()
  return openpgp.sign({
    privateKeys: privateKey,
    data: msg
  }).then(function(signed) {
    return signed.data
  })
}
sign.usage = 'sign *email* *"message"*'
sign.doc = 'Signs *message* using the private key for *email*.'

// Verify a message
function verify (email, msg) {
  let publicKey = locallookup(email)  
  return openpgp.verify({
    publicKeys: publicKey,
    message: openpgp.cleartext.readArmored(msg)
  }).then(function(verified){
    let signature = verified.signatures.map(getFullSignature)
    console.log(signature)
    signature = signature.filter(x => x.email === email)    
    if (signature.length < 1) {
      return 'Not signed by ' + email
    } else {
      return printSignature(signature[0])
    }
  })
}
verify.usage = 'verify *email* *"message"*'
verify.doc = 'Verifies a signed *message* using the public key for *email*.'

// Alice encrypts a signed message for Bob
function demo6 () {
  // Load Alice's private key for signing from localstorage
  let privateKey = keyring.privateKeys.keys[0]
  // Load Bob's public key for encrypting
  let publicKey = keyring.privateKeys.keys[1]
  openpgp.encrypt({
    publicKeys: publicKey,   // NOTE: it's plural...
    privateKeys: privateKey,
    data: 'hello world'
  }).then(function(encrypted) {
    console.log(encrypted.data)    
    // Load Alice's public key for validating
    let publicKey = keyring.privateKeys.keys[0]
    // Load Bob's private key for decrypting
    let privateKey = keyring.privateKeys.keys[1]
    return openpgp.decrypt({
      privateKey: privateKey,
      publicKeys: publicKey,
      message: openpgp.message.readArmored(encrypted.data)
    })
  }).then(function(decrypted){
    console.log(decrypted.data)
    for (let signature of decrypted.signatures) {
      printSignatures(signature)
    }
  })
}

// TODO: add demos illustrating how Alice and Bob can send messages to each other

// User Commands
var cmds = {
  help, 
  clear,
  lookup,
  keygen,
  list,
  encrypt,
  decrypt,
  sign,
  verify,
};

// Welcome message
setTimeout( () => {
  output('(If you want to write your own app using this console UI checkout [HTML5 Console Site](http://codepen.io/wmhilton/pen/PbGqQG))')
  output('')
  output('## Welcome to the Interactive OpenPGP console program.')
  output(help())
}, 0)

/*
 * * * * * * * * USER INTERFACE * * * * * * *
 */

function clear () {
  $("#outputs").html("")
}
clear.usage = () => "clear"
clear.doc = () => "Clears the terminal screen"

function help (cmd) {
  if (cmd) {
    let result = "#### Usage: "
    let usage = cmds[cmd].usage
    let doc = cmds[cmd].doc
    result += (typeof usage === 'function') ? usage() : usage
    result += "\n"
    result += (typeof doc === 'function') ? doc() : doc
    return result
  } else {
    let result = "**Commands:**\n\n"
    print = Object.keys(cmds)
    for (let p of print) {
      let usage = cmds[p].usage
      usage = (typeof usage === 'function') ? usage() : usage
      result += "- " + usage + "\n"
    }
    return result
  }
}
help.usage = () => "help *[command]*"
help.doc = () => "Without an argument, lists available commands. If used with an argument displays the usage & docs for the command."

// Set Focus to Input
$('.console').click(function() {
  $('.console-input').focus()
})

// Display input to Console
function input() {
  var cmd = $('.console-input').val()
  $("#outputs").append("<div class='output-cmd'>" + cmd + "</div>")
  $('.console-input').val("")
  autosize.update($('textarea'))
  $("html, body").animate({
    scrollTop: $(document).height()
  }, 300);
  return cmd
}

// Output to Console
function output(print) {
  console.log(String(print))
  if (print !== void(0)) {
    if (!window.md) {
      window.md = window.markdownit({
        linkify: true,
        breaks: true
      })
    }
    $("#outputs").append(window.md.render(String(print)))
  }
  $(".console").scrollTop($('.console-inner').height());
}

// Break Value
var newLine = "<br/> &nbsp;";

autosize($('textarea'))

var cmdHistory = []
var cursor = -1

// Get User Command
$('.console-input').on('keydown', function(event) {
  if (event.which === 38) {
    // Up Arrow
    cursor = Math.min(++cursor, cmdHistory.length - 1)
    $('.console-input').val(cmdHistory[cursor])
  } else if (event.which === 40) {
    // Down Arrow
    cursor = Math.max(--cursor, -1)
    if (cursor === -1) {
      $('.console-input').val('')
    } else {
      $('.console-input').val(cmdHistory[cursor])
    }
  } else if (event.which === 13) {
    event.preventDefault();
    cursor = -1
    let text = input()
    let args = getTokens(text)[0]
    let cmd = args.shift().value
    args = args.filter(x => x.type !== 'whitespace').map(x => x.value)
    cmdHistory.unshift(text)
    if (typeof cmds[cmd] === 'function') {
      let result = cmds[cmd](...args)
      if (result instanceof Promise) {
        result.then(output)
      } else {
        console.log(result)
        output(result)
      }
    } else if (cmd.trim() === '') {
      output('')
    } else {
      output("Command not found: `" + cmd + "`")
      output("Use 'help' for list of commands.")
    }
  }
});

//ParticlesBG
particlesJS('particles-js',{'particles':{'number':{'value':50},'color':{'value':'#ffffff'},'shape':{'type':'triangle','polygon':{'nb_sides':5}},'opacity':{'value':0.06,'random':false},'size':{'value':11,'random':true},'line_linked':{'enable':true,'distance':150,'color':'#ffffff','opacity':0.4,'width':1},'move':{'enable':true,'speed':4,'direction':'none','random':false,'straight':false,'out_mode':'out','bounce':false}},'interactivity':{'detect_on':'canvas','events':{'onhover':{'enable':false},'onclick':{'enable':true,'mode':'push'},'resize':true},'modes':{'push':{'particles_nb':4}}},'retina_detect':true},function(){});
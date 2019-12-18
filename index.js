
const Client = require('bitcoin-core');
const Server = require('express');
const app = Server();
const keys = require('./keys.json');
const coins = new Object();
const fs = require('fs');
const atob = require('atob');

for( let a = 0; a < keys.coins.length; a++ ) {
	coins[ keys.coins[a].name ] = new Client({
		username:keys.coins[a].username,
		password:keys.coins[a].password,
		port:keys.coins[a].port
	});
}

app.get('/:coin/:cmd/:user', function(req, res){
        if ( chkusr( req.connection.remoteAddress, req.params.user, req.header('Authorization'), req.params.coin, req.params.cmd) ) {
                coins[ req.params.coin ].command( atob(req.params.cmd) ).then((info) => {
                        res.send(info);
                }).catch((e) => {
                        res.send(e);
                });
        } else {res.send('NOT OK');}
});

function unslt( word ) {
	word=atob(word);
	if (word.substring(0,36) == keys.salt) { return word.substring(36,250); }
	else { return false;}
}

function chkusr(ip, usr, pwd, coin, cmd) {
        let err = 0;
        for( let i = 0; i < keys.bans.length; i++ ) if (ip == keys.bans[i]) { console.log(ip+' blocked.'); return false; };
	for ( let a = 0; a < keys.allows.length; a++ ) {
		if ( '::ffff:'+keys.allows[a] == ip || keys.allows[a] == ip ) {
			for( let u = 0; u < keys.users.length; u++ ) {
				if(atob(usr)==keys.users[u].username){
					if(unslt(pwd)==keys.users[u].password){
						if(keys.users[u].coin==coin|| coin=='any') {
							console.log(ip+' '+coin+' $'+atob(cmd));
							err=1;
							return true;
						} else if (!err) {err=1;console.log('Coin '+coin+' permissions issue.'); }
					} else if (!err) {err=1;console.log('PWD invalid.'); } 
				} else if (!err) {err=1;console.log('USR '+atob(usr)+' invalid.'); }
			}
		} else if (!err) {err=1;console.log('IP '+ip+' invalid.'); }
	}
	
	//block(ip);
	return 0;

}

function block(ip) { 
	keys.bans.push(ip);
	fs.writeFile( './keys.json', JSON.stringify(keys), (err,res) => {
		if (err) throw (err);
	});
}

app.get('/', (req,res) => { 
	let c=chkusr( req.connection.remoteAddress, req.header('User-Agent'),req.header('Authorization'),'any','index');
	if (c) {res.send('OK');} else {res.send(null);}
});

app.listen(9250);

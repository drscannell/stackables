{spawn, exec} = require 'child_process'

# ------------ subtasks ------------

build = (callback) ->
	cmd = "cat client/src/model*.js " +
		"client/src/collection*.js " +
		"client/src/view*.js " +
		"client/src/main.js " +
		"> client/lib/client.js"
	child = exec cmd
	child.stdout.on 'data', (data) -> console.log data.trim()
	child.stderr.on 'data', (data) -> console.log data.trim()
	child.on 'exit', (status) ->
		callback() if callback

runServer = (callback) ->
	cmd = "node server/server.js"
	child = exec cmd
	child.stdout.on 'data', (data) -> console.log data.trim()
	child.stderr.on 'data', (data) -> console.log data.trim()
	child.on 'exit', (status) ->
		callback() if callback

# ------------ command line tasks ------------

# cake build
buildDescrip = 'concatenate client/src/* as client/lib/client.js'
task 'build', buildDescrip, (options) ->
	build ->
		console.log 'client.js built'

# cake try1
task 'try', 'run server', (options) ->
	build ->
		console.log 'client.js built'
		runServer ->

	


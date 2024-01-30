// import workerCode from './test1.js?raw';
// const blob = new Blob([workerCode], { type: 'application/javascript' });
// const workUrl = window.URL.createObjectURL(blob);
// const work = new Worker(
//   new URL(workUrl, import.meta.url),
//   { type: 'module' }
// );

// work.postMessage('hello,test1')
// work.onmessage = (e) => {
//   console.log(`主进程收到了子进程发出的信息：${e.data}`);
// 	// 主进程收到了子进程发出的信息：你好，我是子进程！
// 	work.terminate();
// }

// 其他导入worker方式
// import Worker from './test1.js?worker'
// const worker = new Worker()

// worker.postMessage('hello,test1')
// worker.onmessage = (e) => {
//   console.log(`主进程收到了子进程发出的信息：${e.data}`);
// 	// 主进程收到了子进程发出的信息：你好，我是子进程！
// 	worker.terminate();
// }

// 其他导入worker方式 有问题
// import test1 from './test1.js'
// import test2 from './test2.js'
// let scripts = `${test1.toString()};${test2.toString()};`
// console.log(scripts);

// const worker = new Worker(URL.createObjectURL(new Blob([scripts])));
// worker.postMessage('hello,test1')
// worker.onmessage = (e) => {
//   console.log(`主进程收到了子进程发出的信息：${e.data}`);
// 	// 主进程收到了子进程发出的信息：你好，我是子进程！
// 	worker.terminate();
// }

// const worker = new Worker(new URL('./worker.js', import.meta.url))
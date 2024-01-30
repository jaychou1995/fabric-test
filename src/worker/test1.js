
onmessage = (e) => {
	console.log(`收到了主进程发出的信息：${e.data}`); 
	//收到了主进程发出的信息：hello worker
	postMessage('你好，我是子进程！');
}


// export default function test1() {
//   console.log(1111111);
// }
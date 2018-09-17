using System.Collections;
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Quobject.SocketIoClientDotNet.Client;
using Newtonsoft.Json;

public class Request {
	public int seq {get; set;}
	public string id {get; set;}
	public string servn {get; set;}
	public List<string> inputval {get; set;}

	public Request(string id, string servn, List<string> inputval)
	{
		this.id = id;
		this.servn = servn;
		this.inputval = inputval;
	}
}


public class Response 
{
	public int seq {get; set;}
	public string id {get; set;}
	public string servn {get; set;}
	public string errMsg {get; set;}
	public string errCode {get; set;}
	public List<string> inputval {get; set;}
	// seq, id, servn, ret
}

public class Node
{
	public string service {get; set;}
	public string str {get; set;}
}


public class SocketIOScript : MonoBehaviour {
	public int CliSeq = 0;

	public GameObject LoginGUI;
	public Text NameView, BestScoreView;

	public static string serverURL = "http://localhost:3000";

	public bool LoginSucess = false;

	protected Socket socket = null;

	protected static Queue QueueZip = new Queue();

	protected bool isConnect = false;

	public void Start()
	{
		DoOpen(serverURL);
	}

	void Update()
	{
		lock(QueueZip)
		{
			if (QueueZip.Count != 0)
			{
				if (isConnect)
				{
					Node getNode = (Node) QueueZip.Dequeue();
					Send(getNode.service.ToString(), getNode.str.ToString());
				}
				else
				{
					// reconnect to server
					DoOpen(serverURL);
				}
			}
		}

		if (LoginSucess && !FlappyScript.HadLogin)
		{
			ScoreManagerScript.Score = 0;
			NameView.text = FlappyScript.UserName;
			BestScoreView.text = FlappyScript.userBestScore;
			BestScore.bScore = Convert.ToInt32(FlappyScript.userBestScore);
			FlappyScript.HadLogin = true;
			GameStateManager.GameState = GameState.Intro;
		}
	}

	public void Destroy() {
		DoClose();
	}

	protected void process_login(Socket socket, Response json)
	{
		// Response from Service Login
		if (json.servn == "fbcb_login")
		{
			if (json.errCode == "1" && json.id == FlappyScript.UserID)
			{
				FlappyScript.userBestScore = Convert.ToString(json.inputval[0]);
				LoginSucess = true;
			}
			else
			{
				LoginSucess = false;
				LoginGUI.SetActive(true);
			}
		}
	}

	protected void process_register(Socket socket, Response json)
	{
		// Response from Service Register
		if (json.servn == "fbcb_reg")
		{
			if (json.errCode == "1" && json.id == FlappyScript.UserID)
			{
				LoginSucess = true;
			}
			else
			{
				LoginSucess = false;
				LoginGUI.SetActive(true);
			}
		}
	}

	protected void process_submitScore(Socket socket, Response json)
	{
		if (json.servn == "fbcb_submitScore")
		{
			if (json.errCode == "1" && json.id == FlappyScript.UserID)
			{
				Debug.Log("Submit Score Success !!!");
			}
			else
			{
				Debug.Log("Submit Score error !!!");
			}
		}
	}

	protected void process_rank(Socket socket, Response json)
	{
		if (json.servn == "fbcb_rank")
		{
			if (json.errCode == "1" && json.id == FlappyScript.UserID)
			{
				updateScore.insertShowRankQueue(json.inputval);
				Debug.Log("Get Rank Success !!!");
			}
			else
			{
				Debug.Log("Get Rank error !!!");
			}
		}

	}

	// Use this for initialization
	public void DoOpen(string URL) {
		if (socket == null) {
			socket = IO.Socket(URL);
			socket.On (Socket.EVENT_CONNECT, () => {
				// Access to Unity UI is not allowed in a background thread, so let's put into a shared variable
				Debug.Log("Socket.IO connected.");
				isConnect = true;
			});

			socket.On("fbcb_login", (data) => {
				string msg = data.ToString();
				var json = JsonConvert.DeserializeObject<Response>(msg);

				process_login(socket, json);

				Debug.Log("Recv >> " + msg);
				Destroy();
			});

			socket.On("fbcb_reg", (data) => {
				string msg = data.ToString();
				var json = JsonConvert.DeserializeObject<Response>(msg);

				process_register(socket, json);

				Debug.Log("Recv >>" + msg);
				Destroy();
			});

			socket.On("fbcb_submitScore", (data) => {
				string msg = data.ToString();
				var json = JsonConvert.DeserializeObject<Response>(msg);

				process_submitScore(socket, json);

				Debug.Log("Recv >>" + msg);
				Destroy();
			});

			socket.On("fbcb_rank", (data) => {
				string msg = data.ToString();
		
				var json = JsonConvert.DeserializeObject<Response>(msg);

				process_rank(socket, json);

				Debug.Log("Recv >>" + msg);
				Destroy();
			});

		}
	}

	void DoClose() {
		if (socket != null) {
			socket.Disconnect ();
			isConnect = false;
			socket = null;
		}
	}

	public static string CreateRequest(string id, string servn, List<string> inputval)
	{
		Request rq = new Request(id, servn, inputval);
		rq.seq = FlappyScript.CliSeq++;
		return JsonConvert.SerializeObject(rq);
	}

	void Send(string service, string str) {
		if (socket != null) {
			socket.Emit(service, str);
			Debug.Log("Send >> [" + service + "] Msg :" + str);
		}
	}

	public static void SSend(string service, string str) {
		Node newNode = new Node();
		newNode.service = service;
		newNode.str = str;
		QueueZip.Enqueue(newNode);
	}
}

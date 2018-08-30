using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

public class updateScore : MonoBehaviour {

	// Use this for initialization
	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		
	}

	public static void submitScore(string UID, int score, int bestscore, string servicename)
	{
		List<string> inputval = new List<string>() {UID, score.ToString(), bestscore.ToString()};
		string request = SocketIOScript.CreateRequest(UID, servicename, inputval);
		SocketIOScript.SSend(servicename, request);
	}
}

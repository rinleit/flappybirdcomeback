using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BestScore : MonoBehaviour {

	public static int bScore {get; set;}

	// Use this for initialization
	void Start () {
        // hide element Tens and Hundered
        (bTens.gameObject as GameObject).SetActive(false);
        (bHundreds.gameObject as GameObject).SetActive(false);
	}
	
	// Update is called once per frame
	void Update () {
            if(bScore < 10)
            {
                //just draw units
                bUnits.sprite = numberSprites[bScore];
            }
            else if(bScore >= 10 && bScore < 100)
            {
                (bTens.gameObject as GameObject).SetActive(true);
                bTens.sprite = numberSprites[bScore / 10];
                bUnits.sprite = numberSprites[bScore % 10];
            }
            else if(bScore >= 100)
            {
                (bHundreds.gameObject as GameObject).SetActive(true);
                (bTens.gameObject as GameObject).SetActive(true);
                bHundreds.sprite = numberSprites[bScore / 100];
                int rest = bScore % 100;
                bTens.sprite = numberSprites[rest / 10];
                bUnits.sprite = numberSprites[rest % 10];
            }
	}

    public Sprite[] numberSprites;
    public SpriteRenderer bUnits, bTens, bHundreds;
}
